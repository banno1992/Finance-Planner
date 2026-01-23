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
- **Styling**: Tailwind CSS with custom dark theme, shadcn/ui components
- **Charts**: Recharts for data visualization (line charts, bar charts, pie charts)
- **Build Tool**: Vite with React plugin

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

## Features

### Dashboard
- Net worth tracking with month-over-month change
- Optional inclusion of student loans, mortgage equity, and pension in net worth
- Growth projections based on current savings rate

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
