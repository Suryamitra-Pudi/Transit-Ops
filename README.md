# TransitOps — Smart Transport Operations Platform

An end-to-end transport operations platform: vehicle registry, driver management,
trip dispatch, maintenance workflow, fuel/expense tracking, and analytics — with
enforced business rules and role-based access control (RBAC).

Built for the TransitOps hackathon brief. See `docs/BUSINESS_RULES.md` for a
map of every mandatory rule to the exact code that enforces it, and
`docs/API.md` for the full API reference.

## Stack

- **Client**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Recharts
- **Server**: Express + Prisma (SQLite by default, swappable to Postgres) + JWT auth

## Structure

```
TransitOps/
├── client/            # Next.js frontend
│   ├── app/           # Pages (login, dashboard, vehicles, drivers, trips, maintenance, fuel-expenses, reports)
│   ├── components/    # Sidebar, KpiCard, StatusBadge, Modal, Field
│   ├── lib/           # api client, auth session helpers
│   ├── hooks/         # useAuth
│   ├── services/      # typed API wrappers per resource
│   └── types/         # shared TypeScript types
│
├── server/
│   ├── prisma/        # schema.prisma + seed.js
│   ├── controllers/   # business logic & rule enforcement
│   ├── routes/        # Express routers (with RBAC middleware)
│   ├── middleware/     # auth, rbac, error handling
│   ├── services/      # prisma client, report calculations
│   └── app.js
│
├── docs/               # BUSINESS_RULES.md, API.md
└── README.md
```

## Getting started

### 1. Server

```bash
cd server
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

The server runs on `http://localhost:4000`. The seed script creates one demo
user per role (password: `password123`) plus two vehicles and two drivers
(one with an expired license, to demo the dispatch validation).

### 2. Client

```bash
cd client
cp .env.local.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000` — you'll land on the login screen with demo
logins pre-filled for one click.

## Demo logins (password: `password123`)

| Role | Email |
|---|---|
| Fleet Manager | fleet.manager@transitops.dev |
| Driver | driver@transitops.dev |
| Safety Officer | safety.officer@transitops.dev |
| Financial Analyst | financial.analyst@transitops.dev |
| Admin | admin@transitops.dev |

## Implemented (mandatory deliverables)

- Responsive web interface
- Authentication with RBAC (JWT + role-gated routes)
- CRUD for Vehicles and Drivers
- Trip Management with validation (cargo vs. capacity, license/status checks)
- Automatic status transitions (dispatch/complete/cancel, maintenance open/close)
- Maintenance workflow
- Fuel & Expense tracking with automatic operational cost rollups
- Dashboard with KPIs + filters (vehicle type, region)
- Charts and analytics (fuel efficiency, operational cost, ROI) + CSV export

## Notes / next steps (bonus features from the brief, not yet built)

- PDF export (CSV export is implemented)
- Email reminders for expiring licenses (the API endpoint `GET /drivers/expiring-licenses` already exists — wiring it to a cron + email service is the remaining step)
- Vehicle document management (file uploads)
- Dark mode
