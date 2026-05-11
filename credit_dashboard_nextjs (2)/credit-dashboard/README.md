# Credit Follow-Up Agent — Next.js Dashboard

A dark, terminal-aesthetic Next.js 14 dashboard for the Finance Credit Follow-Up Email Agent.
Built with **shadcn/ui + Tailwind CSS + Recharts**.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| UI Components | shadcn/ui (Badge, Button, Card, Tooltip, Progress) |
| Styling | Tailwind CSS with custom dark theme |
| Charts | Recharts (Donut + Bar) |
| Icons | Lucide React |
| Fonts | Syne (display) · DM Sans (body) · JetBrains Mono (data) |

## Features

- **Overview** — KPI cards, donut/bar charts, stage breakdown with progress bars, escalation alerts, security checklist
- **Invoice Queue** — Sortable table with stage filter pills, click any row to open the AI-generated email preview modal
- **Audit Trail** — Full audit log table matching `logs/audit.db`, with status legend

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev

# 3. Open
open http://localhost:3000
```

## Connecting to Live Agent Data

Currently the dashboard uses static mock data from `lib/data.ts` that mirrors your CLI output exactly.

To connect to live data from `logs/audit.db`:

1. Add an API route at `app/api/audit/route.ts` that reads the SQLite database
2. Use `better-sqlite3` or `drizzle-orm` to query it
3. Replace the imports in `app/page.tsx` with `fetch('/api/audit')`

```bash
npm install better-sqlite3 @types/better-sqlite3
```

```ts
// app/api/audit/route.ts
import Database from 'better-sqlite3';
import { NextResponse } from 'next/server';

export async function GET() {
  const db = new Database('../../credit_agent/logs/audit.db');
  const entries = db.prepare('SELECT * FROM audit_log ORDER BY id DESC').all();
  return NextResponse.json(entries);
}
```

## File Structure

```
credit-dashboard/
├── app/
│   ├── globals.css          # Dark theme, fonts, stage CSS classes
│   ├── layout.tsx           # Root layout with scanline effect
│   └── page.tsx             # Main dashboard (3 tabs)
├── components/
│   ├── ui/                  # shadcn/ui components
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── progress.tsx
│   │   ├── separator.tsx
│   │   └── tooltip.tsx
│   ├── AuditLogTable.tsx    # Full audit trail table
│   ├── EmailModal.tsx       # Email preview modal
│   ├── InvoiceTable.tsx     # Sortable invoice table
│   ├── PortfolioChart.tsx   # Donut + bar charts (Recharts)
│   ├── RunSummaryBanner.tsx # Run stats banner
│   ├── Sidebar.tsx          # Left nav
│   ├── StageBadge.tsx       # Stage indicator badge
│   ├── StatCard.tsx         # KPI metric card
│   └── StatusBadge.tsx      # DRY_RUN / SENT / FAILED / ESCALATED
├── lib/
│   ├── data.ts              # Mock data from CLI output
│   ├── types.ts             # TypeScript interfaces + STAGES config
│   └── utils.ts             # cn() helper
├── components.json          # shadcn/ui config
├── tailwind.config.ts
└── package.json
```
