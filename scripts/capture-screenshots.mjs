/**
 * Capture real CampusConnect UI screenshots into docs/screenshots/.
 *
 * Prerequisites:
 *   - MySQL running with the campusconnect DB
 *   - Backend on http://localhost:8080 (Flyway applied, seeds loaded)
 *   - Frontend Vite on http://127.0.0.1:5173
 *
 * From frontend/:
 *   npm install --no-save playwright@1.49.1
 *   node ../scripts/capture-screenshots.mjs
 *
 * Exits with code 1 if the API is unreachable. Never falls back to the design HTML.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const require = createRequire(path.join(root, 'frontend', 'package.json'))
const { chromium } = require('playwright')

const APP = process.env.CC_APP_URL ?? 'http://127.0.0.1:5173'
const API = process.env.CC_API_URL ?? 'http://localhost:8080/api'
const outDir = path.join(root, 'docs', 'screenshots')

const USERS = {
  student: { email: 'aarav.mehta@student.college.edu', password: 'Password@123' },
  teacher: { email: 'ananya.krishnan@college.edu', password: 'Password@123' },
  admin: { email: 'admin@campusconnect.edu', password: 'Password@123' },
}

const DESKTOP = { width: 1440, height: 900 }
const MOBILE = { width: 390, height: 844 }

async function fail(message) {
  console.error(`\nERROR: ${message}\n`)
  process.exit(1)
}

async function assertApiReachable() {
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'probe@invalid', password: 'invalid' }),
    })
    // Any HTTP response means the server is up (401/400/422 are fine).
    if (!res) await fail(`No response from API at ${API}`)
  } catch (error) {
    await fail(
      `API is not reachable at ${API} (${error.cause?.code ?? error.message}).\n` +
        `Start MySQL, run the backend (./mvnw spring-boot:run), apply seeds, then retry.`,
    )
  }
}

async function apiLogin(role) {
  const user = USERS[role]
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  })
  if (!res.ok) {
    const body = await res.text()
    await fail(`Login failed for ${user.email} (${res.status}): ${body}`)
  }
  return res.json()
}

async function apiGet(pathName, accessToken) {
  const res = await fetch(`${API}${pathName}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    await fail(`GET ${pathName} failed (${res.status})`)
  }
  return res.json()
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t)
    document.documentElement.classList.toggle('dark', t === 'dark')
    localStorage.setItem('theme', t)
  }, theme)
  await page.waitForTimeout(150)
}

async function shot(page, name, { fullPage = true } = {}) {
  const file = path.join(outDir, `${name}.png`)
  await page.screenshot({ path: file, fullPage })
  console.log('wrote', path.relative(root, file))
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function loginViaForm(page, { email, password }) {
  // Avoid the backend login rate limiter between role switches.
  await sleep(4000)
  for (let attempt = 1; attempt <= 4; attempt++) {
    await page.goto(`${APP}/login`, { waitUntil: 'networkidle' })
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByLabel(/^email$/i).fill(email)
    await page.getByLabel(/^password$/i).fill(password)
    await page.getByRole('button', { name: /^sign in$/i }).click()
    try {
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 })
      await page.waitForLoadState('networkidle')
      return
    } catch {
      const alert = page.getByRole('alert')
      const msg = (await alert.count()) ? await alert.first().innerText() : 'unknown'
      console.warn(`Form login attempt ${attempt} for ${email} failed: ${msg}`)
      if (/too many|try again/i.test(msg)) await sleep(20000)
      else await sleep(3000)
    }
  }
  throw new Error(`Form login failed for ${email}`)
}

async function capturePair(page, baseName) {
  await setTheme(page, 'light')
  await shot(page, `${baseName}-light`)
  await setTheme(page, 'dark')
  await shot(page, `${baseName}-dark`)
}

async function gotoAndSettle(page, urlPath) {
  await page.goto(`${APP}${urlPath}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
}

async function main() {
  await assertApiReachable()
  fs.mkdirSync(outDir, { recursive: true })

  // Discover real IDs from the API so routes match seeded data.
  const studentAuth = await apiLogin('student')
  const teacherAuth = await apiLogin('teacher')

  const studentClasses = await apiGet('/classrooms?page=0&size=20', studentAuth.accessToken)
  const teacherClasses = await apiGet('/classrooms?page=0&size=20', teacherAuth.accessToken)
  const teacherClass = (teacherClasses.content ?? []).find((c) => c.myRole === 'TEACHER') ?? teacherClasses.content?.[0]
  if (!teacherClass || !(studentClasses.content ?? []).length) {
    await fail('No classrooms found. Run seed_phase1.sql (and phase 2/3) against the database.')
  }

  // Prefer a student class that already has assignments (phase-2 seed covers classes 1–3).
  let studentClass = null
  let assignment = null
  for (const classroom of studentClasses.content ?? []) {
    const page = await apiGet(`/classrooms/${classroom.id}/assignments?page=0&size=20`, studentAuth.accessToken)
    if (page.content?.length) {
      studentClass = classroom
      assignment = page.content[0]
      break
    }
  }
  if (!studentClass || !assignment) {
    await fail('No assignments found for the student. Run seed_phase2.sql.')
  }

  const browser = await chromium.launch({ headless: true })
  try {
    // --- Login (logged out) ---
    {
      const page = await browser.newPage({ viewport: DESKTOP })
      await page.goto(`${APP}/login`, { waitUntil: 'networkidle' })
      await capturePair(page, 'login')
      await page.close()
    }

    // --- Student: dashboard, assignment, calendar, notifications, mobile to-do ---
    {
      const page = await browser.newPage({ viewport: DESKTOP })
      await loginViaForm(page, USERS.student)

      await gotoAndSettle(page, '/')
      await capturePair(page, 'dashboard')

      await gotoAndSettle(page, `/classes/${studentClass.id}/assignments/${assignment.id}`)
      await capturePair(page, 'assignment')

      await gotoAndSettle(page, '/calendar')
      await capturePair(page, 'calendar')

      await gotoAndSettle(page, '/notifications')
      await capturePair(page, 'notifications')

      await page.setViewportSize(MOBILE)
      await gotoAndSettle(page, '/todo')
      await capturePair(page, 'mobile-todo')
      await page.close()
    }

    // --- Teacher: class stream + gradebook ---
    {
      const page = await browser.newPage({ viewport: DESKTOP })
      await loginViaForm(page, USERS.teacher)

      await gotoAndSettle(page, `/classes/${teacherClass.id}/stream`)
      await capturePair(page, 'class-stream')

      await gotoAndSettle(page, `/classes/${teacherClass.id}/grades`)
      await capturePair(page, 'gradebook')
      await page.close()
    }

    // --- Admin dashboard ---
    {
      const page = await browser.newPage({ viewport: DESKTOP })
      try {
        await loginViaForm(page, USERS.admin)
      } catch (error) {
        await fail(
          `Admin login failed for ${USERS.admin.email}. ${error.message}. ` +
            `If the account is missing, run seed_phase3.sql.`,
        )
      }
      await gotoAndSettle(page, '/admin')
      await capturePair(page, 'admin')
      await page.close()
    }
  } finally {
    await browser.close()
  }

  console.log('\nDone. Screenshots are in docs/screenshots/')
}

main().catch(async (error) => {
  await fail(error.stack ?? String(error))
})
