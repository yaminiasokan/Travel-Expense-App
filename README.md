# Waypoint — Travel Expense Management System

A Splitwise-style expense tracker built specifically for group trips: log
shared expenses, split them equally / by percentage / by exact amount / by
shares, and get told exactly who should pay whom — with the **minimum
number of transactions** — to settle up.

This is the **Full-Stack MVP** scope: a real, working Django REST API and a
real, working Next.js UI covering auth, trips, members, expenses, splitting,
and settlements. It intentionally does **not** yet include Docker/CI,
Celery/Redis background jobs, PDF/Excel report generation, or Google login —
those are natural next additions once this core is in your hands. Nothing
in what's here is a stub: every endpoint and every screen is real,
connected, and tested.

## What's included

**Backend** (`/backend`) — Django 5 + Django REST Framework
- JWT auth: register, login, refresh, logout, change/forgot/reset password, email verification (console-logged in dev)
- Trips: create, edit, archive, delete, invite by code/link, join, member roles (owner/admin/member) with permission checks
- Expenses: full CRUD, categories, receipts, filtering by date/amount/category/member, search
- **Split engine**: equal / percentage / exact / share splits, decimal-safe so splits always sum exactly to the total
- **Settlement engine**: nets every member's balance, then runs a greedy min-cash-flow (debt simplification) algorithm to produce the minimum number of payoff transactions; supports partial payments
- Activity feed + notifications on expense/settlement/member events
- Swagger/Redoc API docs, standardized error responses, pagination/filtering/ordering everywhere
- 36 automated tests (unit tests for the split & settlement math, plus full HTTP-level API tests) — all passing

**Frontend** (`/frontend`) — Next.js 15 (App Router) + TypeScript + Tailwind
- Auth pages (login/register) with client-side validation
- Dashboard: trip list, create trip, join trip by invite code
- Trip detail: Overview / Expenses / Settlements / Members tabs
- Add-expense flow with live per-person split inputs for every split type
- Settlements panel: balances, "recalculate settlements", record (partial) payments
- Members panel: invite code, roles, remove/promote members
- **Interactive polish**: Framer Motion transitions (page/tab fades, card hover lift, animated modals, staggered list entrances), toast notifications on every create/update/delete/payment action, live-updating balances/settlements/expenses (polling every 6–8s so numbers refresh without a manual reload), and a charts-driven Overview tab (spending-by-category pie chart, spending-over-time bar chart, animated budget usage bar) built with Recharts
- **Visual identity — "Boarding Pass"**: a deliberate design system built around a travel/ticketing motif rather than a generic template look — trip cards are literal boarding passes (perforated tear line, barcode strip, gate-style labels), a departure-board navy hero/sidebar with a gold accent reserved for tickets and active states, an animated flight-path hero on the login/register screens, and Space Grotesk + Inter + IBM Plex Mono for display/body/ledger type
- **Light/dark theme toggle**, preference stored and restored across visits, with an anti-flash boot script so the correct theme applies before first paint
- **Premium dashboard**: navy hero with quick stats, an upcoming-trip countdown widget, a real recent-activity timeline (aggregated live from your trips' actual activity logs, not fabricated), a floating quick-add-expense button that lets you jump straight into logging an expense on any trip, and a real notification bell (polls the backend, shows unread counts, mark-as-read)
- **Premium trip page**: a gradient cover band per trip, an overlapping avatar stack of members, a live day-countdown badge, and a circular animated budget-usage ring in place of a flat bar
- **Premium expense cards**: a category icon per expense (mapped from the backend's seeded category icons) and a split-type badge
- JWT stored client-side with automatic refresh-token retry on 401s
- Production build verified (`npm run build` succeeds)

## Running it locally

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate          # uses SQLite by default, zero config
python manage.py createsuperuser  # optional, for /admin/
python manage.py runserver
```

API root: `http://localhost:8000/api/v1/`
Swagger docs: `http://localhost:8000/api/v1/docs/`
Admin: `http://localhost:8000/admin/`

Run the test suite:
```bash
pytest
```

To use PostgreSQL instead of SQLite, set `DATABASE_URL` in `.env`, e.g.
`postgres://user:password@localhost:5432/travel_expense`, then re-run
`python manage.py migrate`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # points at http://localhost:8000/api/v1
npm run dev
```

Visit `http://localhost:3000`.

### 3. Try it end to end

1. Register two accounts (open a second browser/incognito window for the second).
2. As user A, create a trip — copy the invite code shown on the Members tab.
3. As user B, "Join with code" on the dashboard using that code.
4. As user A, add an expense (e.g. ₹4000 hotel, split equally between both).
5. Open the Settlements tab → "Recalculate settlements" → you'll see exactly
   who owes whom and how much.
6. Mark it paid (supports partial payments too).

## Project layout

```
backend/
  config/          settings, root urls, custom DRF exception handler
  accounts/        custom User model, JWT auth, profile
  trips/           Trip, TripMember, Invitation, ActivityLog, Notification
  expenses/        Category, Expense, ExpenseSplit, split calculation service
  settlements/      Settlement, Payment, debt-simplification engine + tests
frontend/
  src/app/         routes (login, register, dashboard, trips/[id])
  src/components/  UI primitives + feature panels (expenses, settlements, members)
  src/lib/         API client, typed endpoints, auth store, formatting helpers
```

## Notes on scope vs. the original spec

The original brief described a very large enterprise system (Celery/Redis
background jobs, Docker/Compose/Nginx/CI pipelines, PDF/Excel/CSV report
generation, Google OAuth, full test coverage across every module, etc). Per
your direction, this delivery is the **Full-Stack MVP slice** of that spec —
the parts that make the product actually work end to end — built as real,
tested code rather than scaffolding. The architecture (service layer
separated from views, repository-style querysets, typed API client) is set
up so the remaining modules can be added incrementally without rework.
