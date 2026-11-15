# ⚖️ AuctionLens — Multi-Portal Auction Intelligence Platform

> **Tagline:** *One Platform. Multiple Auction Sources.*  
> An enterprise-grade forward auction intelligence, discovery, and monitoring platform aggregating publicly accessible notices across **GeM Forward Auction**, **MSTC**, **PSU Portals**, and **Bank E-Auctions**.

---

## 🏛️ Statutory Notice & Ethical Compliance

> [!IMPORTANT]
> **AuctionLens is an independent information aggregator.**  
> - We strictly index **publicly accessible** notices without bypassing authentication, CAPTCHA, rate-limits, or security controls.
> - We **never** store user credentials, session cookies, or OTPs.
> - We **do not automate bidding or place bids**. All bidding must occur directly on official government portals (e.g., [GeM Forward Auction](https://forwardauction.gem.gov.in/eprocure/home)).
> - We **never invent data**. If a portal does not publish a price, location or closing date, the field is shown as *not disclosed* (or the record is skipped). Records from the built-in mock provider are labelled **SAMPLE DATA** everywhere in the UI.

---

## 🏗️ System Architecture

```
                                  AUCTIONLENS
                                       │
                ┌──────────────────────┴──────────────────────┐
                │                                             │
      🌐 React SaaS Frontend                        ⚙️ Express REST API
     (Tailwind + TanStack Query)                    (TypeScript + Zod + JWT)
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       │
                           ┌───────────┴───────────┐
                           │   Provider Registry   │
                           └───────────┬───────────┘
                                       │
          ┌────────────────┬───────────┼───────────┬────────────────┐
          ▼                ▼           ▼           ▼                ▼
     [GeM Adapter]   [MSTC Adapter]  [Bank]      [PSU]        [Mock Provider]
          │                │           │           │                │
          └────────────────┴───────────┼───────────┴────────────────┘
                                       │
                           ┌───────────▼───────────┐
                           │ Normalization Engine  │
                           │  • Status Calculator  │
                           │  • Deduplication (ID) │
                           └───────────┬───────────┘
                                       │
                           ┌───────────▼───────────┐
                           │  PostgreSQL + Prisma  │
                           │   (JSONB rawData)     │
                           └───────────┬───────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
             🔔 Alert Matcher Engine          ⏱️ Background Scheduler
            (In-App Real-time Notices)         (node-cron Status Sync)
```

---

## 🚀 Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS, "Aurora Ink" design system (dark/light themes, glass surfaces, Sora + Inter typography)
- **Motion:** Framer Motion (`LazyMotion`, shared-layout tab pills, scroll reveals, count-up stats, page transitions); respects `prefers-reduced-motion`
- **Particles:** tsParticles (lazy-loaded network background on the hero and sign-in screens; disabled for reduced-motion users)
- **State & Data Fetching:** TanStack Query v5 + Axios
- **Routing:** React Router DOM v6
- **Icons & Visuals:** Lucide React + Recharts (Admin analytics charts)

### Backend
- **Runtime:** Node.js + Express (TypeScript Strict Mode)
- **Database & ORM:** PostgreSQL + Prisma ORM
- **Security & Auth:** JWT + Refresh Token strategy + bcryptjs + Helmet + CORS + Rate Limiting
- **Scraper / Ingestion:** Pluggable Provider Registry + Cheerio HTML Parser + Axios + node-cron
- **Validation:** Zod Schema Validation

---

## 📁 Repository Structure

```
gem-auction-portal/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database models & indexes
│   │   └── seed.ts             # 50+ realistic multi-source auctions & test users
│   ├── src/
│   │   ├── config/             # Environment, Prisma, constants
│   │   ├── controllers/        # REST route handlers
│   │   ├── middleware/         # Auth, Admin guard, error handler, rate limiter
│   │   ├── providers/
│   │   │   ├── base/           # AuctionDataProvider interface & ProviderRegistry
│   │   │   ├── gem/            # GeM Forward Auction Provider
│   │   │   ├── mstc/           # MSTC Portal Provider (Adapter Ready)
│   │   │   └── mock/           # 50+ Multi-Portal Offline Dataset Provider
│   │   ├── scraper/            # Normalizer, Deduplicator, Ingestion Pipeline
│   │   ├── jobs/               # Background scheduler (node-cron)
│   │   ├── services/           # Business logic, Search, Alerts, Saved Auctions
│   │   ├── types/              # TypeScript definitions
│   │   ├── utils/              # Status calculator, JWT, Logger, Slugify
│   │   ├── validators/         # Zod schemas
│   │   ├── app.ts              # Express setup & CORS
│   │   └── server.ts           # Server bootstrap & provider registration
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # StatusBadge, SourceBadge, AuctionCard, Table, Filters
│   │   ├── context/            # AuthContext (JWT, Demo Logins, Saved Watchlists)
│   │   ├── hooks/              # useCountdown real-time ticker
│   │   ├── pages/              # Home, Explorer, Detail, Ending Soon, Sources, Admin...
│   │   ├── services/           # Axios API connectors
│   │   ├── types/              # Frontend types
│   │   └── utils/              # INR currency formatters & relative dates
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🛠️ Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18 or later
- **npm**: v9 or later
- **PostgreSQL**: (or Docker Compose)

### 1. Clone & Setup Environment
```bash
cp .env.example backend/.env
```

### 2. Install Dependencies
```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 3. Database Migration & Seed
```bash
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
cd ..
```

> **Pre-configured Demo Accounts:**
> - **Administrator:** `admin@auctionlens.io` / `AdminPassword@2026`
> - **Industrial Buyer:** `buyer@auctionlens.io` / `BuyerPassword@2026`
> *(One-click demo login buttons are also available on the Login screen)*

> Demo-login buttons are shown only in development builds (`vite dev`); they are compiled out of production bundles.
> The seed script reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` and refuses to seed production with the default password.

### Data modes (`DATA_PROVIDER`)

| Value | Providers registered |
|---|---|
| `mock` *(default)* | Sample data only (labelled **SAMPLE DATA**) |
| `live` | Real portals only (GeM, GeM Bids, CG State, GePNIC portals, MSTC adapter) |
| `all` | Both |

Other notable settings (see `.env.example`): `CORS_ORIGINS`, `TRUST_PROXY`, `GEPNIC_ALLOW_INSECURE_TLS`.
In `NODE_ENV=production` the API refuses to start unless `JWT_SECRET` and `JWT_REFRESH_SECRET` are distinct random values of 32+ characters.

### Upgrading an existing database

The schema now stores undisclosed prices as `NULL` and versions refresh tokens. After pulling, run `npx prisma db push` in `backend/`.
Data ingested by older builds contains estimated prices and invented catalog entries; inspect and repair it with:

```bash
cd backend
npx ts-node scripts/repair-legacy-data.ts          # dry run
npx ts-node scripts/repair-legacy-data.ts --apply  # apply
```

### 4. Start Development Servers
```bash
# In Root Directory (Runs frontend & backend concurrently):
npm run dev

# Or run individually:
# Terminal 1: Backend (http://localhost:5000)
npm --prefix backend run dev

# Terminal 2: Frontend (http://localhost:5173)
npm --prefix frontend run dev
```

---

## 🐳 Docker Deployment

To launch the full PostgreSQL, Redis, Backend, and Nginx-powered Frontend in containers:

```bash
# Root .env must define JWT_SECRET and JWT_REFRESH_SECRET (openssl rand -hex 32); compose refuses to start otherwise.
docker compose up -d
```
The backend image includes Chromium (for the GeM scraper) and applies the Prisma schema on start. Postgres, Redis and the API are bound to `127.0.0.1` only.
- **Frontend Web UI:** `http://localhost`
- **Backend API:** `http://localhost:5000`
- **Health Check:** `http://localhost:5000/api/health`

---

## 🔌 How to Add a New Auction Portal

The system is built on a **source-agnostic provider adapter architecture**. To connect a new auction portal (e.g. *Bank IBAPI* or *State PSU*):

### Step 1: Create the Provider Class
In `backend/src/providers/your_portal/YourPortalProvider.ts`, implement `AuctionDataProvider`:

```typescript
import { AuctionDataProvider, RawAuction, RawAuctionDetail, ProviderHealth } from '../../types/provider';

export class YourPortalProvider implements AuctionDataProvider {
  public readonly sourceCode = 'YOUR_CODE';
  public readonly sourceName = 'Your Auction Portal Name';
  public readonly baseUrl = 'https://portal.gov.in';

  public async fetchAuctions(): Promise<RawAuction[]> {
    // 1. Fetch public listing notices
    // 2. Map portal fields to RawAuction
    return [];
  }

  public async fetchAuctionDetails(externalId: string): Promise<RawAuctionDetail | null> {
    // Return detailed lot specifications
    return null;
  }

  public async healthCheck(): Promise<ProviderHealth> {
    return { source: this.sourceCode, healthy: true, responseTimeMs: 45 };
  }
}
```

### Step 2: Register Provider in `server.ts`
```typescript
import { YourPortalProvider } from './providers/your_portal/YourPortalProvider';

providerRegistry.register(new YourPortalProvider());
```

### Step 3: Add Source Record in Database
```sql
INSERT INTO auction_sources (id, code, name, baseUrl, enabled) 
VALUES (cuid(), 'YOUR_CODE', 'Your Portal Name', 'https://portal.gov.in', true);
```

**That is all!** The core backend, search engine, alert matcher, database deduplicator, and React frontend will automatically support the new portal with zero changes required to business logic.

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/auctions` | Multi-source search & filter auctions with pagination | Public |
| `GET` | `/api/auctions/:id` | Get full auction details by ID or external ID | Public |
| `GET` | `/api/auctions/ending-soon` | Live auctions closing within N hours | Public |
| `GET` | `/api/auctions/stats` | Global metrics & distribution statistics | Public |
| `GET` | `/api/sources` | List all registered auction sources | Public |
| `GET` | `/api/categories` | Categories directory with active notice counts | Public |
| `GET` | `/api/locations/states` | States & Union Territories directory | Public |
| `POST` | `/api/auth/register` | Register new user account | Public |
| `POST` | `/api/auth/login` | Sign in & receive access token + refresh cookie | Public |
| `GET` | `/api/auth/me` | Current authenticated user profile | User |
| `GET` | `/api/saved-auctions` | Get saved watchlist | User |
| `POST` | `/api/saved-auctions/:id` | Bookmark an auction | User |
| `GET` | `/api/alerts` | List active alert rules | User |
| `POST` | `/api/alerts` | Create automated alert rule | User |
| `GET` | `/api/notifications` | User alert notifications feed | User |
| `GET` | `/api/admin/dashboard` | Scraper health & system telemetry | Admin |
| `POST` | `/api/admin/scraper/run/:source` | Trigger on-demand pipeline ingestion | Admin |
| `POST` | `/api/sources/:code/sync` | Ingest one portal now | Admin |
| `POST` | `/api/sources/batch-sync` | Ingest several portals (`{ "codes": [...] }`) | Admin |
| `POST` | `/api/auth/refresh` | Rotate access token from the refresh cookie | Cookie |
| `POST` | `/api/auth/logout` | Clear cookie and revoke all refresh tokens for the user | Cookie |

---

## 🧪 Testing

Run the automated backend test suite:
```bash
npm run test
```
The test suite validates:
- Real-time Auction Status transitions (`UPCOMING` ➔ `LIVE` ➔ `ENDING_SOON` ➔ `CLOSED`)
- Provider Normalization & Schema Validation
- ProviderRegistry multi-portal dispatch
- Mock dataset integrity (50+ auctions)
- Multi-field keyword and category search
- Data integrity: no invented prices, locations or closing dates; unsafe document URLs dropped
- Deterministic fallback IDs, IST date conversion, bounded concurrency, query validation (422 on bad input)

---

## 📄 License
This project is released under the **MIT License**.
