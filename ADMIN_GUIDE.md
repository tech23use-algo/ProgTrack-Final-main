# ProgTrack — Database & Admin Guide

> **Database engine**: MySQL 8.4 (via Docker)  
> **Schema management**: Hibernate JPA (`ddl-auto=update` auto-creates / migrates tables)  
> **DB admin UI**: Adminer (web-based, ships with Docker Compose)

---

## 1 · Start Everything

```bash
# From the project root (ProgTrack-Final-main/)
docker compose up -d          # starts MySQL + Adminer

cd backend
./mvnw spring-boot:run        # starts the Spring Boot API on :8080
```

> [!NOTE]
> On first boot the app automatically creates the admin account defined in `.env`.

---

## 2 · Login Credentials

### 🔑 Admin Login

| Field    | Value                     |
|----------|---------------------------|
| Email    | `admin@progtrack.local`   |
| Password | `Admin@1234!`             |
| Role     | `ADMIN`                   |

**Via REST API:**
```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "admin@progtrack.local",
  "password": "Admin@1234!"
}
```
Returns a JWT token. Use it as `Authorization: Bearer <token>` on all subsequent requests.

---

### 👤 Employee Login

Employees **do not self-register**. The admin creates their account (see §4).  
They then log in with the email + password the admin set:

```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "employee@example.com",
  "password": "EmployeePass1!"
}
```

---

## 3 · View the Database (Admin Point of View)

### Option A — Adminer Web UI ✅ (recommended)

1. Run `docker compose up -d`
2. Open **http://localhost:8081** in your browser
3. Fill in the login form:

   | Field    | Value              |
   |----------|--------------------|
   | System   | MySQL              |
   | Server   | `mysql`            |
   | Username | `root`             |
   | Password | `goal_tracker_dev` |
   | Database | `goal_tracker`     |

4. Click **Login**

You can now browse tables, run SQL queries, edit rows, export CSV/SQL, and more — all from the browser.

> [!TIP]
> From the Adminer sidebar click **SQL command** to run arbitrary queries, e.g.:
> ```sql
> SELECT id, email, display_name, role, active FROM users;
> SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 50;
> ```

---

### Option B — MySQL CLI

```bash
# Connect via Docker
docker exec -it progtrack-final-main-mysql-1 mysql \
  -u root -pgoal_tracker_dev goal_tracker

# Useful queries
SHOW TABLES;
DESCRIBE users;
SELECT id, email, display_name, role, active, created_at FROM users;
SELECT * FROM goal WHERE user_id = 5;
SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 20;
```

---

### Option C — MySQL Workbench / DBeaver / TablePlus

Connect with:

| Setting  | Value              |
|----------|--------------------|
| Host     | `127.0.0.1`        |
| Port     | `3306`             |
| User     | `root`             |
| Password | `goal_tracker_dev` |
| Database | `goal_tracker`     |

---

## 4 · Admin: Create an Employee Account

> [!IMPORTANT]
> Employees cannot self-register. Only an admin can create accounts.

**Step 1 — get the admin token** (see §2 above)

**Step 2 — create the employee:**

```http
POST http://localhost:8080/api/admin/users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "email": "alice@company.com",
  "password": "AlicePass1!",
  "displayName": "Alice Smith",
  "role": "USER"
}
```

Valid roles: `USER` (employee) · `MANAGER` · `ADMIN`

The response contains the new user's `id`. Share the email + password with the employee directly.

---

## 5 · Admin: Reset an Employee's Password

If an employee forgets their password, the admin can set a new one:

```http
PATCH http://localhost:8080/api/admin/users/{userId}/password
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "password": "NewPassword1!"
}
```

Replace `{userId}` with the numeric ID from the users table.

> [!NOTE]
> Password must be **8–100 characters**. The action is recorded in the audit log.

---

## 6 · Admin API Reference

All endpoints require `Authorization: Bearer <admin-token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users` | List all users (supports `?search=` and `?role=`) |
| `POST` | `/api/admin/users` | Create employee/manager account |
| `PATCH` | `/api/admin/users/{id}/password` | **Reset employee password** |
| `PATCH` | `/api/admin/users/{id}/role` | Change role (`USER`/`MANAGER`/`ADMIN`) |
| `PATCH` | `/api/admin/users/{id}/status` | Activate / deactivate account |
| `PATCH` | `/api/admin/users/{id}/manager` | Assign a manager to employee |
| `DELETE` | `/api/admin/users/{id}` | Delete user |
| `GET` | `/api/admin/stats` | System stats (user counts, goal count, avg completion) |
| `GET` | `/api/admin/audit-log` | Last 200 audit log entries |
| `GET` | `/api/admin/ai-usage` | AI call usage summary |

---

## 7 · Database Schema

```
users
  id, email, password_hash, display_name, role, active, manager_id, created_at

goal
  id, title, description, target_date, hours_per_day, assigned_by_manager_id, user_id → users.id

milestone
  id, title, description, status (TODO|DONE), estimated_minutes, day_number, goal_id → goal.id

goal_comment
  id, goal_id → goal.id, manager_id, text, created_at

audit_log
  id, actor_id, action, target_id, timestamp
```

Full DDL is in [`backend/src/main/resources/schema.sql`](file:///Users/shlokchorge/Desktop/ProgTrack-Final-main/backend/src/main/resources/schema.sql).

---

## 8 · Environment Variables (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_URL` | `jdbc:mysql://localhost:3306/goal_tracker?...` | JDBC connection URL |
| `DB_USER` | `root` | DB username |
| `DB_PASSWORD` | `goal_tracker_dev` | DB password |
| `JWT_SECRET` | *(set in .env)* | JWT signing key (≥ 32 chars) |
| `ADMIN_EMAIL` | `admin@progtrack.local` | Seeded admin email |
| `ADMIN_PASSWORD` | `Admin@1234!` | Seeded admin password |
| `GROQ_API_KEY` | — | Optional AI features |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowed origins |

> [!CAUTION]
> Change `JWT_SECRET` and `ADMIN_PASSWORD` before deploying to production.
