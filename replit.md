# NetWorth Tracker

## Overview

A personal finance web application for tracking net worth and predicting future financial growth. The app allows users to create custom asset/debt categories, record monthly balance snapshots, track income and expenses, and visualize financial data through charts. It also includes specialized calculators for student loans and mortgages.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with custom dark theme, shadcn/ui components
- **Charts**: Recharts for data visualization (line charts, bar charts, pie charts)
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API with typed route definitions in `shared/routes.ts`
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod for runtime type validation, drizzle-zod for schema-to-Zod conversion

### Data Storage
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema Location**: `shared/schema.ts` defines all database tables
- **Migrations**: Drizzle Kit for database schema management (`npm run db:push`)

### Key Data Models
1. **Categories** - User-defined asset/debt categories (e.g., "Bank Account", "Crypto", "Credit Card")
2. **Snapshots** - Monthly net worth recordings with breakdown by category
3. **Cashflows** - Income and expense items for forecasting
4. **Student Loans** - Loan tracking with amortization calculations
5. **Mortgages** - Mortgage tracking with overpayment scenarios

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/  # UI components
│       ├── hooks/       # Custom hooks (use-finance.ts for API calls)
│       ├── pages/       # Route pages
│       └── lib/         # Utilities
├── server/           # Express backend
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Database operations
│   └── db.ts         # Database connection
├── shared/           # Shared between client and server
│   ├── schema.ts     # Drizzle database schema
│   └── routes.ts     # API route type definitions
└── migrations/       # Database migrations
```

### API Pattern
Routes are defined in `shared/routes.ts` with full type safety. The frontend uses custom hooks in `use-finance.ts` that leverage React Query for data fetching and caching.

## External Dependencies

### Database
- **PostgreSQL** - Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM** - Type-safe database queries and migrations

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