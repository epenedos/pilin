# Pilin - Personal Finance Manager

## Project Overview
Full-stack personal finance application for tracking expenses, income, transfers, budgets, and recurring transactions. Includes data visualizations (Sankey diagrams, cash flow forecasts).

## Tech Stack
- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, Axios, D3.js
- **Backend**: Node.js + Express + TypeScript, PostgreSQL (pg driver), Zod validation, JWT auth
- **Infrastructure**: Docker Compose (PostgreSQL, backend, frontend, Nginx reverse proxy)

## Project Structure
```
frontend/src/
  api/           # API client modules (entries, accounts, categories, budgets)
  components/    # React components (ui/, layout/, entries/, charts/)
  pages/         # Page components (Expenses, Income, Transfers, Accounts, etc.)
  auth/          # Auth context & protected routes
  types/         # TypeScript interfaces

backend/src/
  controllers/   # Route handlers
  routes/        # Express route definitions
  repositories/  # Database access layer (SQL queries)
  services/      # Business logic
  schemas/       # Zod validation schemas
  middleware/    # Auth, validation, error handling
  config/        # Database & env config
  types/         # TypeScript interfaces
  utils/         # Helper utilities
```

## Development Commands

### Frontend
```bash
cd frontend
npm run dev        # Vite dev server
npm run build      # TypeScript check + production build (tsc -b && vite build)
npm run preview    # Preview production build
```

### Backend
```bash
cd backend
npm run dev        # Development with hot reload (tsx watch)
npm run build      # TypeScript compilation (tsc)
npm run start      # Production start (node dist/index.js)
npm run migrate    # Run database migrations (tsx src/migrate.ts)
```

### Docker
```bash
docker-compose up          # Start all services
docker-compose up --build  # Rebuild and start
```

## Architecture Notes
- Clean layered architecture: Pages -> API clients -> Controllers -> Services -> Repositories -> Database
- Entry types: `expense`, `income`, `transfer`
- Recurring entries use soft-delete (excluded flag) for generated instances, hard-delete for one-time entries
- Accounts and categories have referential integrity checks on delete
- All API routes are authenticated via JWT middleware
- Frontend uses React Router for SPA routing with protected routes

## Code Conventions
- Functional React components with hooks
- Tailwind CSS for all styling (no CSS files)
- API clients in `frontend/src/api/` wrap Axios calls
- Reusable UI components in `frontend/src/components/ui/` (Modal, etc.)
- Backend follows controller -> service -> repository pattern
- Zod schemas for request validation in backend
- Currency formatting: `Intl.NumberFormat` with USD
