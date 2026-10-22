# CampusConnect

Classroom management web app (Google Classroom–style) for an MCA final mini project.

Monorepo:

- `backend` — Spring Boot 3, Java 21, MySQL 8, JWT auth, Flyway
- `frontend` — React + Vite + TypeScript + Tailwind CSS

## Prerequisites

- Java 21+ (`JAVA_HOME` must point to JDK 21)
- Maven 3.9+ (or use `backend/mvnw`)
- Node.js 20+
- MySQL 8

## Database setup

```sql
CREATE DATABASE IF NOT EXISTS campusconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Default connection (override with env vars):

| Variable      | Default       |
|---------------|---------------|
| `DB_HOST`     | `localhost`   |
| `DB_PORT`     | `3306`        |
| `DB_NAME`     | `campusconnect` |
| `DB_USER`     | `root`        |
| `DB_PASSWORD` | `root`        |
| `JWT_SECRET`  | (dev secret in `application.yml`) |
| `UPLOAD_DIR`  | `./uploads`   |

## Run backend

```bash
cd backend
./mvnw spring-boot:run
```

On Windows:

```bash
cd backend
.\mvnw.cmd spring-boot:run
```

- API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html

Flyway runs `V1__init.sql` and `V2__classwork.sql` on startup (`ddl-auto=validate`). Uploaded files are stored under `UPLOAD_DIR` (default `./uploads`).

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173 (CORS is configured for this origin).

## Seed data

After the backend has migrated the schema once:

```bash
mysql -u root -p campusconnect < backend/src/main/resources/db/seed/seed_phase1.sql
mysql -u root -p campusconnect < backend/src/main/resources/db/seed/seed_phase2.sql
```

Phase 1 seed:

- 2 teachers, 8 students
- 3 classes (Advanced Java, DBMS, Web Technologies Lab)

Phase 2 seed:

- Topics, stream announcements + comments
- Materials metadata, assignments, mixed submissions (submitted / late / missing / graded / returned)

All seed accounts use password: `Password@123`

Example logins:

- Teacher: `ananya.krishnan@college.edu`
- Student: `aarav.mehta@student.college.edu`

## Features

### Phase 1

- Register / login / refresh / logout (JWT access 15 min + refresh 7 days)
- Teachers create, edit, archive classes and regenerate class codes
- Students join via class code
- Dashboard, class shell with tabs, People tab, profile

### Phase 2

- Stream: announcements, pin/unpin, comments, attachments
- Topics to group classwork and materials
- Study materials with upload/download (max 25 MB; PDF, Office, images, ZIP)
- Assignments, student submissions, teacher grading and return
- Student dashboard To-do (upcoming and missing work)
