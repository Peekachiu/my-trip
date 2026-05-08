# 🚀 my-trip — Setup & Run Guide (macOS)

A complete walkthrough to get the **my-trip** project running locally using Docker.
Takes about **5–10 minutes** on the first run.

---

## 📋 Table of Contents

1. [What You're Building](#what-youre-building)
2. [Prerequisites](#prerequisites)
3. [Step 1 — Install Docker (OrbStack)](#step-1--install-docker-orbstack)
4. [Step 2 — Clone the Repository](#step-2--clone-the-repository)
5. [Step 3 — Build & Start the Stack](#step-3--build--start-the-stack)
6. [Step 4 — Verify Everything Works](#step-4--verify-everything-works)
7. [Daily Usage Cheat Sheet](#daily-usage-cheat-sheet)
8. [Troubleshooting](#troubleshooting)
9. [Project Architecture](#project-architecture)

---

## What You're Building

A three-container stack orchestrated by Docker Compose:

| Service    | Technology          | Host Port | Container Port |
|------------|---------------------|-----------|----------------|
| `frontend` | Next.js (React)     | `3000`    | `3000`         |
| `backend`  | Node.js + Express + TypeScript | `3001` | `3001` |
| `db`       | MySQL 8.0           | `3308`    | `3306`         |

```
Browser ──▶ localhost:3000 (frontend)
                  │
                  ▼
           localhost:3001/api (backend)
                  │
                  ▼
           mysql @ db:3306 (internal Docker network)
```

---

## Prerequisites

- **macOS** (Apple Silicon or Intel)
- **Terminal** access
- **Git** installed (`git --version` to check)
- ~**2 GB** free disk space for Docker images

---

## Step 1 — Install Docker (OrbStack)

We recommend **[OrbStack](https://orbstack.dev/)** — it's faster, lighter, and bundles the Docker CLI plus the `docker compose` plugin out of the box. (Docker Desktop also works, but OrbStack is lean.)

### Install via Homebrew

```bash
brew install --cask orbstack
```

### Launch & Verify

1. Open **OrbStack** from Applications (or Spotlight).
2. Accept any permission prompts on first launch.
3. Verify in a terminal:

```bash
docker --version
# → Docker version 29.x.x, build ...

docker compose version
# → Docker Compose version v2.x.x

docker info | grep -i "server version"
# → Server Version: ...   (this confirms the daemon is running)
```

> ⚠️ If you see `Cannot connect to the Docker daemon`, open OrbStack and make sure it's running (menubar icon should be solid, not greyed out).

---

## Step 2 — Clone the Repository

```bash
cd ~/PersonalProject         # or wherever you keep projects
git clone https://github.com/<your-username>/my-trip.git
cd my-trip
```

### Sanity Check — Required Files Must Exist

The project depends on these files being present:

```bash
ls frontend/src/lib/   # should show: api.ts  auth.tsx  currency.tsx  language.tsx  theme.tsx  translations.ts
ls backend/src/lib/    # should show: currency.ts
ls backend/.dockerignore frontend/.dockerignore   # both must exist
```

If any of the above are missing, something went wrong with the clone — run `git status` and `git pull` to recover.

---

## Step 3 — Build & Start the Stack

From the project root (`my-trip/`):

```bash
docker compose up -d --build
```

**What this does:**

| Flag       | Meaning                                                  |
|------------|----------------------------------------------------------|
| `up`       | Create & start all services defined in `docker-compose.yml` |
| `-d`       | Detached mode — runs in the background                   |
| `--build`  | (Re)build images from each `Dockerfile` before starting  |

**First run takes 1–3 minutes** because it has to:
- Pull the `mysql:8.0` image (~170 MB)
- Pull `node:20-alpine` (~50 MB)
- Run `npm install` inside both `backend` and `frontend` containers
- Compile TypeScript (`backend`) and build Next.js (`frontend`)

Expected final output:

```
✔ Image peekachiu/my-trip-backend:latest   Built
✔ Image peekachiu/my-trip-frontend:latest  Built
✔ Container my-trip-db-1        Started
✔ Container my-trip-backend-1   Started
✔ Container my-trip-frontend-1  Started
```

---

## Step 4 — Verify Everything Works

### Check container status

```bash
docker compose ps
```

You should see all three containers with status `Up`:

```
NAME                 SERVICE    STATUS          PORTS
my-trip-backend-1    backend    Up 30 seconds   0.0.0.0:3001->3001/tcp
my-trip-db-1         db         Up 30 seconds   0.0.0.0:3308->3306/tcp
my-trip-frontend-1   frontend   Up 30 seconds   0.0.0.0:3000->3000/tcp
```

### Smoke-test the endpoints

```bash
# Frontend (Next.js)
curl -s -o /dev/null -w "Frontend: HTTP %{http_code}\n" http://localhost:3000
# → Frontend: HTTP 200

# Backend API
curl -s -o /dev/null -w "Backend:  HTTP %{http_code}\n" http://localhost:3001/api/trips
# → Backend:  HTTP 200

# Backend should return JSON (empty array on a fresh DB)
curl -s http://localhost:3001/api/trips
# → []
```

### Open in your browser

🖥️ **http://localhost:3000** — your app is live!

---

## Daily Usage Cheat Sheet

Run all commands from the project root.

### Start / Stop

```bash
docker compose up -d               # start (uses existing images)
docker compose up -d --build       # rebuild images then start (after code changes)
docker compose stop                # stop containers (keeps them + data)
docker compose start               # start previously-stopped containers
docker compose down                # stop + remove containers (keeps DB volume)
docker compose down -v             # ⚠️ also removes DB volume (wipes all data)
```

### Logs

```bash
docker compose logs -f             # follow all service logs
docker compose logs -f backend     # only backend
docker compose logs -f frontend    # only frontend
docker compose logs -f db          # only MySQL
docker compose logs --tail=50 backend   # last 50 lines
```

### Shelling into a container

```bash
docker compose exec backend sh             # shell in backend
docker compose exec frontend sh            # shell in frontend
docker compose exec db mysql -uroot -p     # MySQL CLI (password: password)
```

### Status

```bash
docker compose ps                  # running containers
docker stats                       # live CPU/RAM usage
```

---

## Troubleshooting

### ❌ `Cannot connect to the Docker daemon`

**Cause:** OrbStack (or Docker Desktop) isn't running.
**Fix:** Open OrbStack from Applications. Wait until its menubar icon is solid, then retry.

---

### ❌ `docker: unknown command: docker compose`

**Cause:** You have standalone Docker CLI but no Compose plugin.
**Fix:** Install OrbStack (it bundles Compose v2). See [Step 1](#step-1--install-docker-orbstack).

---

### ❌ Build fails with `tsc: Permission denied` (exit code 126)

**Cause:** Host's `node_modules/` was copied into the container, overwriting the Linux-native install and breaking binary permissions.

**Fix:** Make sure `.dockerignore` exists in **both** `backend/` and `frontend/` with `node_modules` listed. They should contain at minimum:

```gitignore
node_modules
.git
.env
.env.local
.DS_Store
Dockerfile
.dockerignore
```

Then rebuild from scratch:

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

### ❌ Port already in use (`address already in use`)

**Cause:** Something else is using port `3000`, `3001`, or `3308`.

**Fix:** Find and kill the offending process, or change the host-side port in [docker-compose.yml](./docker-compose.yml):

```bash
lsof -i :3000             # find what's using the port
kill -9 <PID>             # stop it
# OR edit docker-compose.yml and change "3000:3000" → "3002:3000"
```

---

### ❌ Frontend loads but API calls fail

**Cause:** Backend not yet ready, or `NEXT_PUBLIC_API_URL` mismatch.

**Fix:**

```bash
docker compose logs backend --tail=20    # look for "Server is running on port 3001"
curl http://localhost:3001/api/trips     # directly confirm backend works
```

If backend keeps crashing, check the DB connection:

```bash
docker compose logs db --tail=30
```

---

### ❌ Stale data / want a fresh DB

```bash
docker compose down -v       # ⚠️ wipes MySQL volume
docker compose up -d --build # rebuild from scratch, re-runs database/init.sql
```

---

### ⚠️ Warning: `the attribute "version" is obsolete`

Harmless — Compose v2 no longer needs the top-level `version:` key. Safe to ignore, or remove the first line of [docker-compose.yml](./docker-compose.yml).

---

## Project Architecture

```
my-trip/
├── backend/                    # Express + TypeScript API
│   ├── src/
│   │   ├── lib/currency.ts
│   │   └── ...
│   ├── Dockerfile
│   ├── .dockerignore           # ⚠️ must include node_modules
│   └── package.json
│
├── frontend/                   # Next.js app
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── auth.tsx
│   │   │   ├── currency.tsx
│   │   │   ├── language.tsx
│   │   │   ├── theme.tsx
│   │   │   └── translations.ts
│   │   └── ...
│   ├── Dockerfile
│   ├── .dockerignore           # ⚠️ must include node_modules + .next
│   └── package.json
│
├── database/
│   └── init.sql                # auto-loaded on first MySQL boot
│
└── docker-compose.yml          # orchestrates all three services
```

### Environment Variables (already wired in `docker-compose.yml`)

| Container  | Variable               | Value                        |
|------------|------------------------|------------------------------|
| `backend`  | `PORT`                 | `3001`                       |
| `backend`  | `DB_HOST`              | `db` (Docker network name)   |
| `backend`  | `DB_USER`              | `root`                       |
| `backend`  | `DB_PASSWORD`          | `password`                   |
| `backend`  | `DB_NAME`              | `trip_db`                    |
| `frontend` | `NEXT_PUBLIC_API_URL`  | `http://localhost:3001/api`  |
| `db`       | `MYSQL_ROOT_PASSWORD`  | `password`                   |
| `db`       | `MYSQL_DATABASE`       | `trip_db`                    |

> 🔐 **For production**, move these into a `.env` file (ignored by git) and reference them with `${VAR}` syntax. The current defaults are fine for local development only.

---

## 🎉 You're Done!

Open **http://localhost:3000** and enjoy building.

Happy coding! ✈️
