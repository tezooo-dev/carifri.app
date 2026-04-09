# FreightLink MVP — Development Progress

## Project Overview
FreightLink is a multi-tenant SaaS freight brokerage / TMS platform built with React + Vite (frontend) and Node.js/Express (backend), backed by Supabase (PostgreSQL). A super admin manages all client companies from a central deployment; each company has its own admin and operations users.

---

## Completed Features

### Phase 1 — Core MVP
**Commit: `0607782`**
- Initial FreightLink MVP: Auth, dispatch, notifications, M-Pesa, GPS tracking
- Dashboard, LiveTracking, LoadBoard pages
- Role-based access: admin / operations

### Phase 2 — Persistence & Polish
**Commits: `b0e2869`, `43f7e0a`**
- Full persistence (localStorage → SQLite)
- Toast notifications, settings, reports, invoice
- LoadBoard fixes, Dashboard page rebuild

### Phase 3 — Enterprise TMS Features
**Commit: `dc7d24c`**
- Carrier management module
- Load bidding board
- Reports export (CSV/PDF)
- Multi-market support
- SQLite backend
- Leaflet maps integration
- Knowledge base

### Phase 4 — Analytics, Onboarding, Landing
**Commit: `6ee2c6c`**
- Analytics dashboard
- Onboarding flow
- Landing page
- User guide
- Privacy policy & Terms of service pages

### Phase 5 — Production-Ready Features
**Commit: `6b504c9`**
- Email integration (Nodemailer)
- Password reset flow
- PDF generation (invoices/BOL)
- Stripe billing integration
- Docker deployment setup (Dockerfile + docker-compose.yml + nginx.conf)

### Phase 6 — RBAC & Ticket System
**Commit: `bb645e7`**
- Ticket management system (create, assign, resolve)
- `super_admin` role added (FreightLink IT, cross-tenant access)
- Custom role permissions engine
- Role hierarchy: super_admin → admin → operations

### Phase 7 — Carrier Portal & Tracking
**Commit: `13cbc28`**
- Carrier self-service portal
- Tracking code lookup (public, no auth required)
- Load status updates by carrier
- ZIP-based transit calculator (`src/lib/transitCalc.js`)
  - Haversine distance × 1.3 road factor
  - 800 km/day HOS standard
  - US + Canada holiday exclusion
  - Returns `{ transitDays, deliveryDate }`

### Phase 8 — ZIP Transit Calculator in PostLoad
**Commit: `f546b29`**
- Integrated `transitCalc.js` into `PostLoad.jsx`
- ZIP codes auto-trigger transit day calculation
- Delivery date auto-fills with "Auto-calculated" badge
- Holiday-aware delivery date estimation

### Phase 9 — OpenStreetMap Address Autocomplete
**Commit: `01ffdc3`**
- New component: `src/components/AddressAutocomplete.jsx`
  - Uses **Photon API** (photon.komoot.io) — free, no API key, OSM-based
  - 320ms debounce + AbortController to cancel stale requests
  - Dropdown with city, state, postal code badge
  - Keyboard navigation: ↑ ↓ Enter Esc + click-outside to close
  - `onSelect` returns `{ display, city, state, postcode, countrycode, lat, lon }`
  - Input turns green with pin icon once address is confirmed
- Integrated into `PostLoad.jsx`:
  - Replaced manual city dropdowns + ZIP inputs with `AddressAutocomplete`
  - `handleOriginSelect` / `handleDestSelect` auto-fill city + ZIP
  - ZIP badge shown inline on label once resolved
  - Transit calc fires automatically on ZIP fill

### Phase 10 — Full Supabase Migration + Multi-Tenant Architecture
**Commit: `cdeb3b7`**

#### Backend: SQLite → Supabase (PostgreSQL)
- Replaced `better-sqlite3` with `pg` (node-postgres)
- New `server/lib/db.js` with async helpers: `one()`, `all()`, `run()`, `withTransaction()`
- `server/db.js` stripped to re-export from `server/lib/db.js`
- All route files migrated to `async/await` with `$1/$2` placeholders

#### Multi-Tenant Architecture
- `companies` table: id, name, slug, plan, status, market, created_at
- `company_id TEXT REFERENCES companies(id) ON DELETE CASCADE` added to:
  - users, carriers, shippers, loads, tickets, custom_roles, analytics_events
- `settings` table: PK changed from `id=1` singleton → `company_id` (one row per company)
- `subscriptions` table: PK changed from `user_id` → `company_id`
- JWT now includes `companyId` claim; `super_admin` gets `companyId: null` (cross-tenant)

#### Auth Middleware (`server/middleware/auth.js`)
- Added `companyId(req)` helper — returns JWT companyId or null
- Added `companyClause(req, startIndex)` — generates `company_id = $N` clause; returns empty for super_admin

#### Routes Migrated
| File | Key Changes |
|------|-------------|
| `auth.js` | `bcrypt.compare` async, JWT includes companyId |
| `users.js` | JSONB custom_perms (no JSON.parse), company_id filter |
| `settings.js` | Per-company settings row, INSERT ON CONFLICT DO NOTHING |
| `loads.js` | Async notifyAdmins, native JSONB/boolean |
| `carriers.js` | Boolean verified (no casting), company_id filter |
| `carrier-details.js` | All JSONB columns native (no stringify) |
| `shippers.js` | Async, company_id added |
| `bids.js` | JSONB accessorials, RETURNING id on INSERT |
| `tickets.js` | Dynamic WHERE builder, /public before /:id |
| `roles.js` | JSONB permissions, company_id |
| `analytics.js` | JSONB operators (`->>'page'`), `::date` cast |
| `billing.js` | Subscriptions by company_id, trial via companies.created_at |
| `carrier-portal.js` | ILIKE search, RETURNING * |

#### New: Companies Management (`server/routes/companies.js`)
- All endpoints restricted to `super_admin`
- GET /: companies + subscription + user count (single JOIN query)
- POST /: `withTransaction` → creates company + settings row + first admin user
- GET /:id: company + users + subscription via `Promise.all`
- PATCH /:id: update name/plan/status
- DELETE /:id: cascade deletes all tenant data

#### Frontend: Companies Dashboard (`src/pages/Companies.jsx`)
- Super admin only (gated in nav + route)
- Stats bar: total companies, active count, total users
- Company table with plan/status badges, market flags, user count
- `CreateModal` — create company + first admin user
- `CompanyDrawer` — view users, suspend/reactivate, delete with confirmation

#### Schema (`supabase/schema.sql`)
- Full PostgreSQL schema for all 18 tables
- JSONB columns: truck_types, contracts, insurance, edi_config, contacts, timeline, accessorials, custom_perms, attachments, permissions, meta
- BOOLEAN columns: verified, cargo_insurance, commission_received, w9_on_file, coi_on_file, is_terminal, is_internal, completed, cross_border, hazmat, temp_controlled
- `tracking_codes`: global reference table (no company_id)

#### Seed Data (`server/seed.js`)
- Async rewrite using `pg` transaction
- Creates 4 demo companies: Kenya (co-ke), India (co-in), Canada (co-ca), USA (co-us)
- All demo users/carriers/shippers/loads assigned to companies
- `ON CONFLICT (id) DO NOTHING` — safe to re-run

#### Infrastructure
- `package.json`: `better-sqlite3` → `pg`
- `.env.example`: DATABASE_URL, DATABASE_SSL added with Supabase setup instructions
- `server/index.js`: removed SQLite init, added `testConnection()` + auto-seed on first start
- `src/App.jsx`: `/companies` route added
- `src/components/Layout.jsx`: Companies nav item (super_admin only)

---

## Deployment Guide

### Supabase Setup
1. Create project at [supabase.com](https://supabase.com)
2. SQL Editor → paste and run `supabase/schema.sql`
3. Settings → Database → Connection string → URI → copy it

### Environment Variables
```env
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
DATABASE_SSL=true
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_...
SMTP_HOST=smtp.example.com
SMTP_USER=you@example.com
SMTP_PASS=yourpassword
```

### Run Locally
```bash
npm install
npm run dev       # starts both Vite (5173) and Express (3001)
```
First start auto-seeds 4 demo companies with users, carriers, loads.

### Docker
```bash
docker-compose up --build
```

---

## Architecture

```
FreightLink SaaS (single deployment)
├── super_admin  → FreightLink IT, cross-tenant, manages all companies
├── Company A (admin + operations users)
├── Company B (admin + operations users)
└── Company N ...
```

- All tenant data isolated by `company_id`
- super_admin JWT has `companyId: null` → bypasses all company filters
- Each company billed separately (Stripe, keyed by company_id)
- Settings, subscriptions, and users are all per-company

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | Supabase (PostgreSQL via `pg`) |
| Auth | JWT (access + refresh tokens), bcrypt |
| Maps | Leaflet, Photon API (OSM geocoder) |
| Billing | Stripe Checkout + Webhooks |
| Email | Nodemailer |
| PDF | (server-side generation) |
| Deploy | Docker + nginx |
