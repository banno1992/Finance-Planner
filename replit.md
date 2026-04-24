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
├── client/           # React frontend
│   └── src/
│       ├── components/  # UI components
│       ├── hooks/       # Custom hooks (use-finance.ts for data operations)
│       ├── pages/       # Route pages
│       └── lib/         # Utilities (localStorage.ts for data storage)
├── server/           # Express backend (serves static files only)
│   └── index.ts      # Server entry point
└── shared/           # Shared types
```

### Data Flow Pattern
All data operations go through `client/src/lib/localStorage.ts` which provides a simple API for CRUD operations. React Query hooks in `use-finance.ts` wrap these operations for cache management and reactivity.

**Note on Cashflow page:** The Cashflow section uses direct useState + useEffect pattern instead of React Query for more reliable immediate UI updates. When adding/editing/deleting cashflows, a refreshCashflows callback re-reads from localStorage to ensure the UI reflects changes instantly.

## Features

### Dashboard
- Net worth tracking with month-over-month change
- Optional inclusion of student loans, mortgage equity, and pension in net worth
- Growth projections based on current savings rate
- Category Trends chart: Line graph showing individual asset category values over time with toggleable visibility and y-axis truncation

### Pension Tracker
- Three scenario modeling (low 3%, medium 5%, high 7% growth)
- Inflation adjustment toggle (show values in today's money)
- Sensitivity analysis slider (0-500 monthly contribution increase)
- UK State Pension integration (only included if retirement age >= 67)
- 4% drawdown rule for retirement income projections

### Data Backup
- Export all data to JSON file
- Import data from JSON file (useful for migrating between devices)

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
- **esbuild** - Production build bundling for server
- **tsx** - TypeScript execution for development
