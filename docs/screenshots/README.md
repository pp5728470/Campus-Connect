# CampusConnect UI screenshots

Light and dark captures of the **running app** for the project report. Desktop shots use a 1440×900 viewport (full page). Mobile to-do uses 390×844.

| File | Screen | Role |
|------|--------|------|
| `login-light.png` / `login-dark.png` | Sign in | — |
| `dashboard-light.png` / `dashboard-dark.png` | Student home | Student |
| `class-stream-light.png` / `class-stream-dark.png` | Class stream | Teacher |
| `assignment-light.png` / `assignment-dark.png` | Assignment detail | Student |
| `gradebook-light.png` / `gradebook-dark.png` | Gradebook | Teacher |
| `calendar-light.png` / `calendar-dark.png` | Calendar | Student |
| `notifications-light.png` / `notifications-dark.png` | Notifications | Student |
| `admin-light.png` / `admin-dark.png` | Admin | Admin |
| `mobile-todo-light.png` / `mobile-todo-dark.png` | To-do (phone) | Student |

## How to capture

1. **MySQL** — start the database (for example XAMPP MySQL).
2. **Backend** — from `backend/`:
   ```bash
   ./mvnw spring-boot:run
   ```
   Use profile `local` if your root password is empty (`--spring.profiles.active=local`).
3. **Seed data** — against the app database, run in order:
   - `backend/src/main/resources/db/seed/seed_phase1.sql`
   - `backend/src/main/resources/db/seed/seed_phase2.sql`
   - `backend/src/main/resources/db/seed/seed_phase3.sql`
4. **Frontend** — from `frontend/`:
   ```bash
   npm run dev -- --host 127.0.0.1 --port 5173
   ```
5. **Capture** — from `frontend/` (Playwright must resolve from this package):
   ```bash
   npm install --no-save playwright@1.49.1
   node ../scripts/capture-screenshots.mjs
   ```

Demo accounts (password `Password@123`):

- Student: `aarav.mehta@student.college.edu`
- Teacher: `ananya.krishnan@college.edu`
- Admin: `admin@campusconnect.edu`

If the API is not reachable, the script prints an error and exits with code 1. It never uses the design HTML mockups.
