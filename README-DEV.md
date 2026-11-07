# Voltra — Next.js + FastAPI + Postgres (dev branch)

E-commerce demo store, migrated from the static HTML/CSS/JS site (still live on `main` / GitHub Pages) to:

- **Frontend:** Next.js 15 (App Router, plain JS/JSX) in [`web/`](web/)
- **Backend:** Python FastAPI + SQLAlchemy in [`backend/`](backend/)
- **Database:** PostgreSQL 16 (via `docker-compose.yml`) — data that used to live in localStorage (products, orders, reviews, accounts) is now in Postgres. The cart stays client-side (React Context + localStorage), like most real stores.

## Features

- 12-product catalog with categories, search, filter, and sort
- Product pages: color options, quantity, image "views", tabs (description / features / specs), reviews (backed by Postgres)
- Auth: register/login with password policy (min 8 chars, capital + lowercase + number + symbol), JWT in an httpOnly cookie
- Checkout: server-calculated totals in integer cents, free shipping over $50 ($6.99 otherwise), card/COD payment choice, order confirmation
- Order history: every order is stored in Postgres per user
- Cart drawer with free-shipping progress note

## Run it locally

### 0. Prerequisites
- Docker (for Postgres) — or any local Postgres
- Python 3.12+
- Node 18+

### 1. Start the database
```powershell
docker compose up -d
```

### 2. Backend (FastAPI)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # (first time only — a sample with dev defaults)
python app\seed.py           # creates tables + 12 products
uvicorn app.main:app --reload --port 8000
```
API docs: http://127.0.0.1:8000/docs

> No Docker? Point `DATABASE_URL` in `backend/.env` at your own Postgres, e.g.
> `postgresql+psycopg://user:pass@localhost:5432/voltra`.

### 3. Frontend (Next.js)
```powershell
cd web
npm install
npm run dev
```
Open http://localhost:3000

The Next dev server proxies `/api/*` to the FastAPI backend (see `web/next.config.mjs`),
so the browser only ever talks to one origin — that's what keeps the auth cookie working.

## Notes

- `main` branch = the original static site (GitHub Pages, untouched).
- `dev` branch = this migration.
- Money is never float math — prices/totals are integer cents, formatted only at render time.
- This is a demo: no real payments are processed; card fields accept the test number `4242 4242 4242 4242`.
