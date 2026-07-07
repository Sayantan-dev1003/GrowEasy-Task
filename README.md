# GrowEasy — Enterprise AI-Powered CSV Importer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-TypeScript-white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-blue)](https://prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue)](https://docker.com/)

An enterprise-grade, AI-powered CSV importer built for the GrowEasy CRM ecosystem. By leveraging the advanced semantic capabilities of Google's Gemini AI, this system intelligently maps wildly inconsistent, schema-less CSV dumps (e.g., Facebook Leads, Google Ads, real-estate CRM exports, and messy manual spreadsheets) directly into a strictly validated CRM schema. 

Say goodbye to rigid templates, frustrating column mappings, and manual data cleanup.

---

## 🏗️ System Architecture

Our robust architecture leverages a decoupled frontend/backend paradigm, streaming real-time AI extraction progress via Server-Sent Events (SSE).

```text
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                       │
│                                                                 │
│  ┌──────────────┐   ┌───────────────────────────────────────┐   │
│  │ Upload Step  │ → │             Preview Step              │   │
│  │ (Dropzone)   │   │ (PapaParse) + In-Button Progress Bar  │   │
│  └──────────────┘   └───────────────────────────────────────┘   │
│                                │                                │
│                                ▼                                │
│                     ┌────────────────────┐                      │
│                     │ Manage Leads Dash  │                      │
│                     └────────────────────┘                      │
└────────────────────────────────┬────────────────────────────────┘
                                 │ POST /api/extract (multipart)
                                 │ SSE Stream ←
┌────────────────────────────────▼────────────────────────────────┐
│                   Backend (Express + TypeScript)                │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────────────┐  │
│  │  multer  │→ │csv-parse │→ │       Import Orchestrator     │  │
│  │ (upload) │  │ (parse)  │  │  ┌────────┐                   │  │
│  └──────────┘  └──────────┘  │  │Chunker │ (20 rows/batch)   │  │
│                              │  └───┬────┘                   │  │
│                              │      │ p-limit (Concurrency)  │  │
│                              │  ┌───▼─────────────────────┐  │  │
│                              │  │  AI Extractor (Gemini)  │  │  │
│                              │  │  + Exponential Backoff  │  │  │
│                              │  └─────────────────────────┘  │  │
│                              └──────────────┬────────────────┘  │
└─────────────────────────────────────────────┼───────────────────┘
                                              │
┌─────────────────────────────────────────────▼───────────────────┐
│           PostgreSQL (Neon / Supabase via Prisma)               │
│         imports table ←→ leads table ←→ skipped_rows table      │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Enterprise Features

- **Schema-Agnostic AI Extraction** — Flawlessly maps arbitrary CSV columns, normalizes ISO 8601 dates, and extracts complex phone/country codes without requiring manual intervention.
- **Real-Time Streaming UX** — Server-Sent Events (SSE) stream progress dynamically to an in-button progress bar, keeping the user informed during heavy AI workloads.
- **Robust Concurrency & Reliability** — Processes records in chunked batches utilizing `p-limit` for concurrency control, wrapped in a defensive **exponential backoff retry mechanism** to gracefully recover from API rate limits.
- **High-Performance UI** — Built on Next.js 14, featuring entirely virtualized tables (`@tanstack/react-virtual`), guaranteeing sub-millisecond scrolling performance when visualizing tens of thousands of records.
- **Production-Ready Dockerization** — Optimized multi-stage Dockerfiles ensure minimal image sizes and non-root runtime environments, with streamlined orchestration via `docker-compose`.
- **Database Persistence & Auditing** — Fully typed Prisma ORM interfacing with PostgreSQL, permanently capturing successful leads and securely documenting rejection reasons for skipped rows.

---

## 🤖 AI Provider: Google Gemini 2.5 Flash

**Why Gemini 2.5 Flash?**
- **1M Token Context Window**: Provides vast headroom for extremely detailed system prompting alongside massive data batches.
- **High-Speed Inference**: Guarantees ultra-low latency chunk processing, ensuring the SSE streaming UX feels instantaneous.
- **JSON-Enforced Output**: Strict adherence to `application/json` response parameters forces completely valid JSON output.
- **Rigid Prompt Engineering**: The model acts purely as a deterministic data-mapping engine. It natively handles semantic mapping (e.g. mapping "Contact Name" to `name`), enum enforcement, and complex logic like isolating Country Codes from raw mobile strings.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js 20+**
- A **PostgreSQL** database (e.g., [Neon](https://neon.tech) or [Supabase](https://supabase.com))
- A **Google AI Studio** [Gemini API key](https://aistudio.google.com)

### 1. Repository Setup

```bash
git clone https://github.com/Sayantan-dev1003/GrowEasy-Task
cd groweasy-csv-importer
```

### 2. Backend Initialization

```bash
cd backend
cp .env.example .env
# Important: Edit .env and supply your DATABASE_URL and GEMINI_API_KEY
npm ci
npx prisma db push      # Initialize database schema
npx prisma generate     # Generate typed Prisma client
npm run dev             # Launches the API on port 4000
```

### 3. Frontend Initialization

```bash
cd frontend
cp .env.example .env.local
# Verify NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
npm ci
npm run dev             # Launches the Web App on port 3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Deployment

The application is fully containerized for immediate production deployment.

```bash
# 1. Copy the environment variables
cp .env.example .env

# 2. Build and launch the orchestrated services
docker-compose up --build -d
```
- **Frontend** will be exposed at `http://localhost:3000`
- **Backend API** will be exposed at `http://localhost:4000`

---

## 🧪 Testing Suite

```bash
# Run backend unit tests
cd backend && npm test

# Generate backend coverage report
cd backend && npm run test:coverage

# Run frontend tests
cd frontend && npm test
```

**Test coverage includes:**
- **CSV Edge Cases:** BOM markers, duplicate headers, empty files, malformed row handling.
- **Batch Orchestration:** Chunker logic and concurrency boundaries.
- **AI Validation:** Enum validators (`crm_status`, `data_source`), Country Code splitting, and date normalization algorithms.

---

## 📁 Directory Structure

```text
groweasy/
├── backend/
│   ├── prisma/schema.prisma          # Relational DB schema
│   ├── src/
│   │   ├── index.ts                  # Express server entry
│   │   ├── routes/                   # API Routing Controllers
│   │   ├── services/                 # Business Logic (CSV, AI, Orchestration)
│   │   └── types/index.ts            # Global Type Definitions
│   ├── Dockerfile                    # Multi-stage optimized Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/                      # Next.js App Router (Pages & Layouts)
│   │   ├── components/               # UI Components & Importer Modals
│   │   ├── lib/api.ts                # Client API & SSE Stream Listener
│   │   └── types/index.ts            # Shared Frontend Types
│   ├── public/samples/               # Provided test CSVs
│   └── Dockerfile                    # Standalone optimized Dockerfile
├── samples/                          # 4 pre-configured test CSVs
├── docker-compose.yml                # Microservices orchestration
└── README.md
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Requirement | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | **Required** | — | Connection string for PostgreSQL |
| `GEMINI_API_KEY` | **Required** | — | Valid Google Gemini API Key |
| `GEMINI_MODEL` | Optional | `gemini-1.5-flash` | Selected Gemini Inference Model |
| `PORT` | Optional | `4000` | Express listening port |
| `BATCH_SIZE` | Optional | `20` | Row count per AI request chunk |
| `BATCH_CONCURRENCY` | Optional | `3` | Maximum simultaneous AI requests |
| `BATCH_MAX_RETRIES` | Optional | `3` | Max exponential backoff attempts |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | ✅ | `http://localhost:4000` | Backend API base URL |

---

## 🧪 Test CSVs

Four sample CSVs are included in `/samples/` to test different real-world shapes:

| File | What it tests |
|---|---|
| `facebook_leads_export.csv` | `full_name`, `phone_number`, `created_time`, ad platform metadata |
| `google_ads_export.csv` | `Customer Name`, combined `Location`, irrelevant campaign columns |
| `realestate_crm_dump.csv` | Dual mobile columns, DD-MM-YYYY dates, `data_source` enum values |
| `messy_manual_spreadsheet.csv` | Typos in headers (`Emal`, `staus`), extra email in notes, ambiguous status strings |

---

## 🏆 Implemented Bonus Features

- ✅ Drag & drop upload
- ✅ Per-batch progress indicator via SSE
- ✅ Incremental streaming results
- ✅ Exponential backoff retry (per batch, isolated)
- ✅ Virtualized table (TanStack Virtual)
- ✅ Dark mode toggle
- ✅ Unit tests (Jest — backend + frontend)
- ✅ Docker setup (Dockerfile × 2 + docker-compose)
- ✅ PostgreSQL persistence via Prisma + Neon

---

## 📝 Known Limitations

- The AI abstains from guessing `data_source` if it's ambiguous — this is intentional per spec
- Very large CSVs (>1000 rows) will take several minutes due to Gemini rate limits
- The free Gemini tier has RPM limits; production use should use a paid key or OpenAI
- No authentication — this is a demo app; add auth before production use
