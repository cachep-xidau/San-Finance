# Marketing Hub — Project Memory

> Context for AI agents working on this project. Updated: 2026-02-28.

## Project Location

`/Users/lucasbraci/Desktop/Antigravity/projects/S Group/marketing`

## Key Files

| File | Purpose |
|------|---------|
| `prd.md` | Full PRD — 4 phases, 10 users, 4 channels |
| `architecture.md` | ADRs, Prisma schema, API design, deployment |
| `epics-and-stories.md` | 7 Epics, 28 User Stories, sprint mapping |
| `app/` | Turborepo monorepo (web + api + packages) |

## Tech Stack

Next.js 15 + shadcn/ui · NestJS · PostgreSQL + Prisma · Redis + BullMQ · grammY · Resend · Better Auth

## Data Import Pipeline

> [!CAUTION]
> **KHÔNG ĐƯỢC đụng tới dữ liệu 2025.** Chỉ cập nhật data 2026 trở đi.
> Google Sheet đã xóa toàn bộ data 2025 — nếu chạy `import-csv.mjs` (full refresh), 4,389 rows 2025 trong DB sẽ bị mất vĩnh viễn.
> **Chỉ dùng `import-new-data.mjs`** (append-only, cutoff >= 2026-01-01).

### Google Sheet Source

`https://docs.google.com/spreadsheets/d/1eh3PNUaut5PcrAep9yIdGo-xmrCl5V9HCkXugQKXP6I`

### Files → Company Mapping

| Google Sheet Tab | CSV File | Company ID |
|-----------------|----------|-----------|
| SAN_NEW | `data/san_new.csv` | `san` |
| TGIL_NEW | `data/implant_new.csv` | `tgil` |
| TEENNIE_NEW | `data/teennie_new.csv` | `teennie` |
| Master | `data/master.csv` | all 3 |

### Import Scripts

| Script | Purpose |
|--------|---------|
| `scripts/import-csv.mjs` | Full refresh — delete all + re-insert (all dates) |
| `scripts/import-master.mjs` | Import campaign master (BẬT/TẮT status) |
| `scripts/import-new-data.mjs` | Append only — filters >= cutoff date, preserves old data |
| `scripts/verify-data.mjs` | Compare DB vs CSV for 2026 data, reports discrepancies |

### Database

- **Models:** `MarketingEntry` (funnel data), `CampaignMaster` (campaign lookup)
- **Local DB:** PostgreSQL 16 (Homebrew) — `marketing:marketing_dev@localhost:5432/marketing_hub`
- **Schema:** `packages/db/prisma/schema.prisma`

### Data Volumes (as of 2026-02-28)

| Company | 2025 Rows | 2026 Rows | Total |
|---------|----------|----------|-------|
| San | 2,787 | 438 | 3,225 |
| Teennie | 279 | 341 | 620 (starts 12/2025) |
| TGIL | 1,323 | 242 | 1,565 (starts 05/2025) |
| **Total** | **4,389** | **1,021** | **5,410** |

### Known Data Quality Issues

- SAN has 4 duplicate composite keys (same date + campaignId + campaignName) with split data (leads in one row, bill in another): Jan 7/19/21/26 2026
- SAN CSV has some junk rows: 28 rows with month `10.2026`, 4 rows with `12.1899`

### Run Commands

```bash
# Start DB
brew services start postgresql@16

# Push schema
DATABASE_URL="..." npx prisma db push --schema=packages/db/prisma/schema.prisma

# Full import (wipes + re-inserts)
node scripts/import-csv.mjs

# Append 2026 data only (preserves 2025)
node scripts/import-new-data.mjs

# Download CSV from Google Sheet (replaces manual export)
node scripts/sync-from-sheet.mjs

# Full pipeline: download + import + master
node scripts/sync-from-sheet.mjs && node scripts/import-new-data.mjs && node scripts/import-master.mjs

# Import to PRODUCTION Neon DB
DATABASE_URL="postgresql://neondb_owner:npg_9qWBhLkrEoI0@ep-winter-unit-a1pe5d9a-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" node scripts/import-new-data.mjs

# Import master data
node scripts/import-master.mjs

# Verify DB vs CSV
node scripts/verify-data.mjs
```

## Deployment

### Vercel

- **Project:** `thaivu-6359s-projects/web`
- **URL:** `https://web-16weq4n2t-thaivu-6359s-projects.vercel.app`

### Production Database (Neon PostgreSQL)

```
DATABASE_URL=postgresql://neondb_owner:npg_9qWBhLkrEoI0@ep-winter-unit-a1pe5d9a-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Import to production:**
```bash
DATABASE_URL="postgresql://neondb_owner:npg_9qWBhLkrEoI0@ep-winter-unit-a1pe5d9a-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" node scripts/import-new-data.mjs
```


