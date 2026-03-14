# Spec and build

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [x] Step: Technical Specification

Assess the task's difficulty, as underestimating it leads to poor outcomes.
- easy: Straightforward implementation, trivial bug fix or feature
- medium: Moderate complexity, some edge cases or caveats to consider
- hard: Complex logic, many caveats, architectural considerations, or high-risk changes

Create a technical specification for the task that is appropriate for the complexity level:
- Review the existing codebase architecture and identify reusable components.
- Define the implementation approach based on established patterns in the project.
- Identify all source code files that will be created or modified.
- Define any necessary data model, API, or interface changes.
- Describe verification steps using the project's test and lint commands.

Save the output to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach
- Source code structure changes
- Data model / API / interface changes
- Verification approach

If the task is complex enough, create a detailed implementation plan based on `{@artifacts_path}/spec.md`:
- Break down the work into concrete tasks (incrementable, testable milestones)
- Each task should reference relevant contracts and include verification steps
- Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function).

Important: unit tests must be part of each implementation task, not separate tasks. Each task should implement the code and its tests together, if relevant.

Save to `{@artifacts_path}/plan.md`. If the feature is trivial and doesn't warrant this breakdown, keep the Implementation step below as is.

**Complexity**: Hard - Multiple database migrations, XE API integration, changes across 8+ pages, architectural changes for multi-currency support.

**Output**: See `spec.md` for full technical specification.

---

### [x] Step: Database Migrations & Backend Types
<!-- chat-id: 1817db64-512c-49ea-b6fc-8a5a47626851 -->

Add currency support to database schema and update TypeScript types.

- [x] Create migration: Add `default_currency VARCHAR(3) DEFAULT 'USD'` to users table
- [x] Create migration: Add `currency VARCHAR(3) DEFAULT 'USD'` to accounts table
- [x] Create migration: Add `currency`, `converted_amount`, `exchange_rate` to money_entries table
- [x] Run migrations to verify they work
- [x] Update `backend/src/types/index.ts` with new fields for User, Account, MoneyEntry
- [x] Verify backend builds: `cd backend && npm run build`

---

### [x] Step: User Profile Backend (Password Change & Currency Settings)
<!-- chat-id: fd6bfab9-1e61-4669-862b-41be98a0b120 -->

Implement backend API for user profile management.

- [x] Update `backend/src/repositories/user.repository.ts`:
  - Add `findByIdWithPassword(id)` method
  - Add `updatePassword(userId, passwordHash)` method
  - Add `updateDefaultCurrency(userId, currency)` method
  - Update `findById` to include `default_currency`
- [x] Create `backend/src/schemas/user.schema.ts` with Zod schemas:
  - `changePasswordSchema` (currentPassword, newPassword with min 8 chars)
  - `updateCurrencySchema` (3-letter currency code validation)
- [x] Create `backend/src/controllers/user.controller.ts`:
  - `getProfile` - GET /api/users/me
  - `changePassword` - PUT /api/users/me/password (verify current password first)
  - `updateCurrency` - PUT /api/users/me/currency
- [x] Create `backend/src/routes/user.routes.ts` and register in main router
- [x] Verify backend builds: `cd backend && npm run build`

---

### [x] Step: Account Currency Support (Backend)
<!-- chat-id: 50e0a524-e27f-4581-96ad-29d11699f225 -->

Update account creation/update to support currency.

- [x] Update `backend/src/schemas/account.schema.ts` to include currency field
- [x] Update `backend/src/repositories/account.repository.ts`:
  - Include currency in create/update queries
  - Include currency in all SELECT queries
- [x] Update `backend/src/controllers/accounts.controller.ts` to handle currency
- [x] Verify backend builds: `cd backend && npm run build`

---

### [x] Step: XE API Integration & Entry Currency Support (Backend)
<!-- chat-id: 5b92d343-66c1-4622-8f80-283a96f05010 -->

Implement currency conversion service and update entries.

- [x] Create `backend/src/services/xe.service.ts`:
  - Implement `getExchangeRate(from, to)` using XE API
  - Add in-memory caching (1 hour expiry)
  - Handle API errors gracefully
- [x] Update `backend/src/schemas/entry.schema.ts` to include currency field
- [x] Update `backend/src/repositories/entry.repository.ts`:
  - Include currency, converted_amount, exchange_rate in queries
- [x] Update entry creation logic to:
  - Call XE API when entry currency differs from account currency
  - Store converted_amount and exchange_rate
- [x] Verify backend builds: `cd backend && npm run build`

---

### [x] Step: Frontend Types & Currency Utility
<!-- chat-id: d8e41adf-a40f-4260-9ecb-e82c69ed6e64 -->

Update frontend types and create currency formatting utility.

- [x] Update `frontend/src/types/index.ts`:
  - Add `defaultCurrency` to User interface
  - Add `currency` to Account interface
  - Add `currency`, `convertedAmount`, `exchangeRate` to MoneyEntry interface
  - Add `accountCurrency` and `toAccountCurrency` to MoneyEntry for display
- [x] Create `frontend/src/utils/currency.ts`:
  - Export `SUPPORTED_CURRENCIES` array (35 currencies)
  - Export `formatCurrency(amount, currency)` function with Intl.NumberFormat
  - Export `getCurrencyOptions()` for select dropdowns
  - Export `getCurrencyInfo()`, `getCurrencySymbol()`, `isSupportedCurrency()` helpers
- [x] Verify frontend builds: `cd frontend && npm run build`

---

### [x] Step: User API Client & Auth Context Update
<!-- chat-id: d66e17c5-9d8a-4604-a5cc-4057ad8845ef -->

Create user API client and update auth context for profile data.

- [x] Create `frontend/src/api/user.api.ts`:
  - `getProfile()` - GET /api/users/me
  - `changePassword(currentPassword, newPassword)` - PUT /api/users/me/password
  - `updateCurrency(currency)` - PUT /api/users/me/currency
- [x] Update `frontend/src/auth/AuthContext.tsx`:
  - Fetch full user profile on mount (not just decode JWT)
  - Add `refreshUser()` method to re-fetch profile after changes
  - Include `defaultCurrency` in context
- [x] Verify frontend builds: `cd frontend && npm run build`

---

### [x] Step: Profile Page & Currency Selector Component
<!-- chat-id: 6f223ba5-8a20-4b52-964c-616a4f0f75b0 -->

Create profile page with password change and currency settings.

- [x] Create `frontend/src/components/ui/CurrencySelector.tsx`:
  - Reusable dropdown for currency selection
  - Use SUPPORTED_CURRENCIES from utility
- [x] Create `frontend/src/pages/ProfilePage.tsx`:
  - Account Information section (email, display name - read only)
  - Password Change section (current password, new password, confirm)
  - Currency Settings section (default currency dropdown)
  - Follow existing page patterns (layout, styling)
- [x] Add route in `frontend/src/App.tsx`: `/profile` → ProfilePage (protected)
- [x] Add "Profile" or "Settings" link in `frontend/src/components/layout/Sidebar.tsx`
- [x] Verify frontend builds: `cd frontend && npm run build`

---

### [x] Step: Account Forms Currency Support (Frontend)
<!-- chat-id: b634dc91-698d-4b84-8f00-8acda499ba6b -->

Add currency selection to account create/edit forms.

- [x] Update `frontend/src/pages/AccountsPage.tsx`:
  - Add CurrencySelector to create account modal
  - Add CurrencySelector to edit account modal
  - Display account currency in the accounts list
- [x] Update `frontend/src/api/accounts.api.ts` if needed for currency field
- [x] Verify frontend builds: `cd frontend && npm run build`

---

### [x] Step: Entry Forms Currency Support (Frontend)
<!-- chat-id: 9d993b8b-9780-44a2-b93b-7227dde32596 -->

Add currency selection to entry forms with conversion preview.

- [x] Update expense/income/transfer entry forms to include CurrencySelector
- [x] Default entry currency to selected account's currency
- [x] Show conversion preview when entry currency differs from account currency
- [x] Update entry display to show original currency and converted amount
- [x] Files to update:
  - `frontend/src/pages/ExpensesPage.tsx`
  - `frontend/src/pages/IncomePage.tsx`
  - `frontend/src/pages/TransfersPage.tsx`
- [x] Verify frontend builds: `cd frontend && npm run build`

---

### [x] Step: Update All Pages with Currency Formatting
<!-- chat-id: a71c30fe-af16-461e-a154-7bca466121c9 -->

Replace hardcoded USD formatting with dynamic currency support.

- [x] Update `frontend/src/pages/DashboardPage.tsx` to use formatCurrency utility
- [x] Update `frontend/src/pages/AccountsPage.tsx` to use account currency
- [x] Update `frontend/src/pages/ExpensesPage.tsx` to use entry currency
- [x] Update `frontend/src/pages/IncomePage.tsx` to use entry currency
- [x] Update `frontend/src/pages/TransfersPage.tsx` to use entry currency
- [x] Update `frontend/src/pages/RecurringPage.tsx` to use formatCurrency utility
- [x] Update `frontend/src/pages/BudgetsPage.tsx` to use formatCurrency utility
- [x] Update `frontend/src/pages/ForecastPage.tsx` to use formatCurrency utility
- [x] Verify frontend builds: `cd frontend && npm run build`

---

### [x] Step: Final Integration & Testing
<!-- chat-id: 7fdccd97-3c74-45af-a6c6-2b2212fdcb0c -->

End-to-end testing and verification.

- [x] Run full backend build: `cd backend && npm run build`
- [x] Run full frontend build: `cd frontend && npm run build`
- [x] Manual verification:
  - Create account with non-USD currency
  - Create entry in different currency than account (verify conversion)
  - Change password (verify old password required)
  - Change default currency (verify persistence)
  - Check all pages display correct currencies
- [x] Write report to `{@artifacts_path}/report.md` describing:
  - What was implemented
  - How the solution was tested
  - Any issues or challenges encountered
