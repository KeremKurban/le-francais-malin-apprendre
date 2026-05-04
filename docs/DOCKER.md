# Docker Compose: when to rebuild, when to stop, when to do nothing

This project runs **backend** (FastAPI + `uvicorn --reload`), **frontend** (Vite), **db** (Postgres), and **mlflow** via Compose. The tables below tell you which action to take after a change.

Commands use Docker Compose v2 (`docker compose`). If you use the older standalone binary, replace with `docker-compose`.

---

## Do nothing (hot reload / file sync)

The stack is already set up to pick up most edits **without** rebuilding or restarting.

| You changed | Why nothing extra is needed |
|-------------|------------------------------|
| **Python** under `backend/` (routes, services, models, etc.) | Backend container mounts `./backend:/app` and runs **`--reload`**. Uvicorn restarts the app when files change. Watch `backend` logs for `Reloading...`. |
| **Frontend** under `src/`, Vite config, `index.html` | Frontend mounts the repo and runs `npm run dev`. Vite **HMR** refreshes the browser. |
| **Env vars in `.env` read only by the browser** | Vite embeds `VITE_*` at **dev server start**. If you changed `VITE_*` and the UI still shows old values, **restart the `frontend` service** (see below). No image rebuild. |

**Verify:** save a file, hit the API or refresh the page. If behavior matches the new code, you are done.

---

## Restart one service (no rebuild)

Use when reload cannot see the change or env was injected at process start.

| Situation | Command |
|-----------|---------|
| Backend stuck / reload did not run | `docker compose restart backend` |
| Changed **`VITE_*`** (API URL, Supabase keys for the SPA) | `docker compose restart frontend` |
| Changed **Compose `environment:`** for a service | Restart **that** service (same as above for backend or frontend). Compose injects env when the container **starts**. |
| Postgres config / you only need DB healthy again | `docker compose restart db` |

These commands **do not** rebuild images; they reuse the existing image and recreated/rerun the container.

---

## `docker compose up --build` (rebuild images)

Rebuild when the **image contents** must change: Dockerfile steps, dependency lists, or base image.

| You changed | Action |
|-------------|--------|
| `backend/Dockerfile` or **`backend/requirements.txt`** | `docker compose up --build backend` (or `--build` for all services that depend on it). Often followed by a running backend picking up new packages—ensure the container actually reinstalls if your Dockerfile installs deps at build time; if deps are install-at-runtime, you may only need `docker compose exec backend pip install -r requirements.txt` instead—prefer rebuilding if unsure. |
| **Frontend `package.json` / lockfile** and the image or entrypoint is meant to install from them | The current compose uses `node:20-alpine` and runs `npm install` in the **command** on start, so a **frontend restart** often picks up new deps. Rebuild the frontend service only if you changed something that is baked into a **custom** image (this stack uses the stock `node` image). |
| First time after `git pull` that changed Docker-related files | `docker compose up --build` (or include `-d` for detached). |

**Common full command (foreground, rebuild if needed):**

```bash
docker compose up --build
```

**Detached:**

```bash
docker compose up -d --build
```

---

## `docker compose down`

Stopping containers and removing the Compose stack from Docker’s perspective—not always deleting data.

| Goal | Command |
|------|---------|
| Stop everything and free ports | `docker compose down` |
| Stop and **delete Postgres + MLflow volumes** (fresh DB / MLflow — **destructive**) | `docker compose down -v` |

**Use `down` when:**

- You want a clean slate before **`docker compose up --build`** after major Dockerfile or compose edits.
- Ports **5173 / 8000 / 5432 / 5001** are still in use and `restart` did not help.
- You are switching to a different project or branch and do not want orphan containers.

**Data:** By default, **named volumes** (`postgres_data`, `mlflow_data`) persist after `down` without `-v`. Your database data survives a normal `down` / `up` cycle.

---

## Quick decision flow

1. **Only edited `backend/app/...` or `src/...`?** → Usually **nothing**; confirm via logs or browser.
2. **Changed `.env` `VITE_*`?** → **`docker compose restart frontend`**.
3. **Changed other `.env` values used by the backend container?** → **`docker compose restart backend`**.
4. **Changed `requirements.txt` or `Dockerfile`?** → **`docker compose up --build`** (at least for `backend`).
5. **Weird state / ports stuck / want a full reset?** → **`docker compose down`** then **`docker compose up --build`**. Add **`-v`** only if you accept **wiping the DB and MLflow volumes**.

---

## Copy-paste prompt: apply every change on a running stack

Use this in Cursor (or any assistant) **after each change** so the answer matches *this* repo’s layout:

```text
This repo: le-francais-malin-apprendre. Docker Compose services: db, backend (uvicorn
--reload, volume ./backend:/app), frontend (npm run dev, volume .:/app, node_modules
anonymous volume), mlflow.

I just made a change: [describe the files and what you changed in one sentence].

Tell me exactly how to see it in the running containers:
- "do nothing" (rely on reload/HMR), OR
- restart which service and the exact `docker compose ...` command, OR
- `docker compose up --build` and for which service(s), OR
- `docker compose down` and whether to use `-v` (and what data is lost).

Assume containers are already running from `docker compose up`.
```

Replace the bracketed sentence with your edit summary each time.
