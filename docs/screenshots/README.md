# CampusConnect UI screenshots

Light and dark captures for the project report.

| File | Screen |
|------|--------|
| `login-light.png` / `login-dark.png` | Sign in (live app) |
| `dashboard-light.png` / `dashboard-dark.png` | Student home |
| `class-stream-light.png` / `class-stream-dark.png` | Class stream |
| `assignment-light.png` / `assignment-dark.png` | Assignment detail |
| `gradebook-light.png` / `gradebook-dark.png` | Gradebook |
| `mobile-todo-light.png` / `mobile-todo-dark.png` | Mobile to-do |

Regenerate with Playwright (from `frontend/`, with Vite on `:5173`):

```bash
npm install --no-save playwright@1.49.1
node ../scripts/capture-screenshots.mjs
```

Authenticated app screens need MySQL and the API running; when they are unavailable the script falls back to frames in `CampusConnect-UI-Design.html` for everything except login.
