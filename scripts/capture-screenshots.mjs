/**
 * Captures redesign screenshots for the project report into docs/screenshots/.
 * Login comes from the running Vite app; other screens from the design HTML frames
 * when MySQL/backend is unavailable.
 */
/**
 * Run from frontend/ after: npm install --no-save playwright@1.49.1
 *   node ../scripts/capture-screenshots.mjs
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const require = createRequire(path.join(root, 'frontend', 'package.json'))
const { chromium } = require('playwright')
const outDir = path.join(root, 'docs', 'screenshots')
fs.mkdirSync(outDir, { recursive: true })

const LOGIN = 'http://127.0.0.1:5173/login'
const DESIGN = path.join(root, 'CampusConnect-UI-Design.html')

async function shot(page, name) {
  const file = path.join(outDir, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  console.log('wrote', file)
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t)
    document.documentElement.classList.toggle('dark', t === 'dark')
    try {
      localStorage.setItem('theme', t)
    } catch {
      /* ignore */
    }
  }, theme)
  await page.waitForTimeout(200)
}

async function captureLogin(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto(LOGIN, { waitUntil: 'networkidle' })
  await setTheme(page, 'light')
  await shot(page, 'login-light')
  await setTheme(page, 'dark')
  await shot(page, 'login-dark')
  await page.close()
}

async function captureDesignFrames(browser) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  await page.goto(`file:///${DESIGN.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' })

  // Design HTML uses body class / data for theme — toggle dark by matching its script.
  const frames = await page.locator('.frame').all()
  // Expected order from design file: login, dashboard, stream, assignment, gradebook, phones…
  const desktop = [
    { index: 0, light: 'login-design-light', dark: 'login-design-dark' },
    { index: 1, light: 'dashboard-light', dark: 'dashboard-dark' },
    { index: 2, light: 'class-stream-light', dark: 'class-stream-dark' },
    { index: 3, light: 'assignment-light', dark: 'assignment-dark' },
    { index: 4, light: 'gradebook-light', dark: 'gradebook-dark' },
  ]

  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => {
      document.documentElement.setAttribute('data-theme', t)
      document.body?.setAttribute('data-theme', t)
      if (t === 'dark') document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    }, theme)
    await page.waitForTimeout(150)

    for (const entry of desktop) {
      const frame = frames[entry.index]
      if (!frame) continue
      await frame.scrollIntoViewIfNeeded()
      await page.waitForTimeout(100)
      const box = await frame.boundingBox()
      if (!box) continue
      const name = theme === 'light' ? entry.light : entry.dark
      // Skip duplicate login-design if we already have live login; still capture for report completeness under app names.
      if (entry.index === 0) continue
      await page.screenshot({
        path: path.join(outDir, `${name}.png`),
        clip: {
          x: Math.max(0, box.x),
          y: Math.max(0, box.y),
          width: Math.min(box.width, 1400),
          height: Math.min(box.height, 900),
        },
      })
      console.log('wrote', name)
    }
  }

  // Mobile to-do: last phone mockups section
  const phonePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await phonePage.goto(`file:///${DESIGN.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' })

  for (const theme of ['light', 'dark']) {
    await phonePage.evaluate((t) => {
      document.documentElement.setAttribute('data-theme', t)
      document.body?.setAttribute('data-theme', t)
    }, theme)
    const phones = phonePage.locator('.phone')
    const count = await phones.count()
    // Prefer a phone that shows to-do if present; else first phone.
    let target = phones.first()
    for (let i = 0; i < count; i++) {
      const text = await phones.nth(i).innerText()
      if (/to-do|missing|due today/i.test(text)) {
        target = phones.nth(i)
        break
      }
    }
    await target.scrollIntoViewIfNeeded()
    await phonePage.waitForTimeout(100)
    const box = await target.boundingBox()
    if (box) {
      await phonePage.screenshot({
        path: path.join(outDir, `mobile-todo-${theme}.png`),
        clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 844) },
      })
      console.log('wrote mobile-todo-' + theme)
    }
  }

  await page.close()
  await phonePage.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await captureLogin(browser)
  await captureDesignFrames(browser)
} finally {
  await browser.close()
}
