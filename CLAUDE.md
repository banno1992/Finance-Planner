# NetWorth Tracker

## Overview

A personal finance web application for tracking net worth and predicting future financial growth. The app allows users to create custom asset/debt categories, record monthly balance snapshots, track income and expenses, and visualize financial data through charts. It also includes specialized calculators for student loans, mortgages, and pension projections with UK state pension integration.

## User Preferences

Preferred communication style: Simple, everyday language.
Data storage preference: Browser LocalStorage (private, no database costs)

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for client-side state
- **Styling**: Tailwind CSS with the CalmCards design system (Mercury-inspired banker-clean), light + dark themes, shadcn/ui components
- **Charts**: Recharts for data visualization (line charts, bar charts, pie charts), tokenized via CSS vars
- **Build Tool**: Vite with React plugin

### Design System (CalmCards)
- **Typography**: Source Serif 4 for headings (`font-serif font-light tracking-tight`), JetBrains Mono `tabular-nums` for numerical values, uppercase `tracking-[0.18em]` for small labels
- **Surfaces**: `rounded-3xl border border-border bg-card/60 backdrop-blur-xl shadow-sm` for cards; `bg-muted/40 rounded-2xl border border-border/60` for stat tiles and rows
- **Color tokens** (defined in `client/src/index.css`):
  - `--chart-accent` (teal #119c74), `--chart-positive` (calm green), `--chart-negative` (calm red)
  - `--chart-1` … `--chart-10` calm series palette for category trend lines, tuned per theme
  - All charts use `hsl(var(--border))`, `hsl(var(--muted-foreground))`, `hsl(var(--card))`, `hsl(var(--foreground))` for grids/axes/tooltips so light + dark both look right

### Data Storage
- **Storage Method**: Browser LocalStorage (`client/src/lib/localStorage.ts`)
- **Privacy**: All data is stored locally in the user's browser - completely private
- **Persistence**: Data persists across browser sessions but is unique to each browser/device
- **Backup**: Export/Import JSON functionality for data backup and migration between devices

### Key Data Models
1. **Categories** - User-defined asset/debt categories (e.g., "Bank Account", "Crypto", "Credit Card")
2. **Snapshots** - Monthly net worth recordings with breakdown by category
3. **Cashflows** - Income and expense items for forecasting
4. **Student Loans** - Loan tracking with amortization calculations
5. **Mortgages** - Mortgage tracking with overpayment scenarios
6. **Pensions** - Retirement projections with UK state pension integration (£221.20/week, age 67)

### Project Structure
```
├── client/              # The whole app (Vite root)
│   ├── index.html       # Entry HTML incl. PWA/iOS meta tags
│   ├── public/          # icon.svg + generated PWA icons (npm run icons)
│   └── src/
│       ├── components/  # UI components
│       ├── hooks/       # Custom hooks (use-finance.ts for data operations)
│       ├── pages/       # Route pages
│       └── lib/         # localStorage.ts (data), deviceStorage.ts (persist/backup helpers)
├── vite.config.ts       # Vite + vite-plugin-pwa (manifest, service worker)
└── pwa-assets.config.ts # Icon generation from client/public/icon.svg
```

This is a static, client-only PWA: no server, no database, no API. All data lives
in the browser via `client/src/lib/localStorage.ts`. The user chose this for
privacy and zero cost. Do not add a backend, database, analytics or any
third-party network requests (fonts are self-hosted via @fontsource) unless
explicitly asked.

### Commands
- `npm run dev` – dev server on http://localhost:5000
- `npm test` – unit tests (node:test via tsx)
- `npm run build` – type-check + production build to `dist/`
- `npm run preview` – serve the built app (service worker active) on port 5000
- `npm run icons` – regenerate PWA icons after editing `client/public/icon.svg`

### Data Flow Pattern
All data operations go through `client/src/lib/localStorage.ts` which provides a simple API for CRUD operations. React Query hooks in `use-finance.ts` wrap these operations for cache management and reactivity.

**Note on Cashflow page:** The Cashflow section uses direct useState + useEffect pattern instead of React Query for more reliable immediate UI updates. When adding/editing/deleting cashflows, a refreshCashflows callback re-reads from localStorage to ensure the UI reflects changes instantly.

## Features

### Dashboard
- Net worth tracking with month-over-month change
- Optional inclusion of student loans, mortgage equity, and pension in net worth
- Growth projections based on current savings rate
- Category Trends chart: Line graph showing individual asset category values over time with toggleable visibility and y-axis truncation
- **Dynamic forward projections**: When student loan / mortgage / pension toggles are on, the projection lines reuse the same logic as the dedicated pages — student loan balances amortise down month-by-month, mortgage equity grows as the loan principal is paid off (property value held flat), and pension pot compounds annually (matching the Pension page) plus user + employer contributions. Historical points still apply current static balances since per-month historical loan/pension values aren't stored.
- **Configurable projection horizon**: A small pill row (1y / 2y / 5y / 10y / 20y / 30y) next to the "Show projection" toggle lets the user pick how far forward to project. The series samples monthly up to 2 years, every 3 months up to 10 years, then every 6 months for 20-30 year horizons to keep the chart readable.

### Pension Tracker
- Three scenario modeling (low 3%, medium 5%, high 7% growth)
- Inflation adjustment toggle (show values in today's money)
- Sensitivity analysis slider (0-500 monthly contribution increase)
- UK State Pension integration (only included if retirement age >= 67)
- 4% drawdown rule for retirement income projections
- **Race to £1M**: Animated progress bar tracking current pot vs £1M target, projected crossing month/year (with fractional-year interpolation), contributions-vs-compound-growth breakdown that demonstrates the compounding story, and "what if" sliders for extra monthly contribution and extra growth-rate assumption. Handles edge cases (already past £1M, never reaches in 60-year horizon, negative growth)

### Cashflow & Budget
- Recurring monthly income and expense items, each editable in place.
- **Need / Want bucket on every expense** — drives the 50/30/20 budget. Legacy expenses without a bucket default to "Need" so older data keeps working.
- **50/30/20 Budget section** — below the income/expense columns: shows Needs (50%), Wants (30%), Savings (20%) targets vs actuals as percentage-of-income, with a thin progress bar per row, an over/under flag in the negative chart color when a bucket is over (or savings are under) target, and a one-line verdict ("On track" / "Wants are over budget" / etc.). Savings is computed as `income − needs − wants`; negative savings shows as a deficit.

### Data Backup & Safety
- Export all data to JSON file (on installed phone apps this opens the share sheet, e.g. "Save to Files")
- Import data from JSON file (useful for migrating between devices)
- Settings shows the last backup date (stored under `networth_last_backup`) and warns after 30 days
- On startup the app calls `navigator.storage.persist()` so the browser doesn't evict data

## External Dependencies

### UI Component Library
- **shadcn/ui** - Pre-built accessible components (configured in `components.json`)
- **Radix UI** - Underlying headless component primitives
- **Tailwind CSS** - Utility-first CSS framework

### Data Visualization
- **Recharts** - React charting library for financial visualizations

### Date Handling
- **date-fns** - Date manipulation and formatting utilities

### Development Tools
- **Vite** - Fast development server and bundler
- **vite-plugin-pwa** - Web app manifest + Workbox service worker (offline, installable)
- **tsx** - Runs the TypeScript unit tests
