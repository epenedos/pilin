# Technical Specification: User Profile Page with Currency Settings

## Task Overview

Implement a user profile page with:
1. Password change functionality
2. Default currency setting per user
3. Currency per account
4. Currency per transaction/entry
5. Currency conversion using XE API for entries in different currencies

**Complexity Assessment**: **Hard**
- Multiple database schema migrations
- External API integration (XE API)
- Changes across 8+ frontend pages
- Architectural changes for multi-currency support

---

## Technical Context

### Technology Stack
- **Backend**: Node.js + Express + TypeScript, PostgreSQL, Zod validation, JWT auth, bcryptjs
- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, Axios
- **Architecture**: Clean layered (Pages → API clients → Controllers → Services → Repositories → Database)

### Key Dependencies
- `bcryptjs` - Password hashing (already used)
- `pg` - PostgreSQL client (already used)
- `zod` - Schema validation (already used)
- `axios` - HTTP client (already used, will be used for XE API)

---

## Implementation Approach

### Phase 1: Database Schema Updates

#### Migration 1: Add default_currency to users table
```sql
-- backend/migrations/XXX_add_user_default_currency.sql
ALTER TABLE users ADD COLUMN default_currency VARCHAR(3) NOT NULL DEFAULT 'USD';
```

#### Migration 2: Add currency to accounts table
```sql
-- backend/migrations/XXX_add_account_currency.sql
ALTER TABLE accounts ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD';
```

#### Migration 3: Add currency to money_entries table
```sql
-- backend/migrations/XXX_add_entry_currency.sql
ALTER TABLE money_entries ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD';
-- Also add converted_amount for storing the converted value in account currency
ALTER TABLE money_entries ADD COLUMN converted_amount NUMERIC(12,2);
-- Add exchange_rate used for conversion (for audit trail)
ALTER TABLE money_entries ADD COLUMN exchange_rate NUMERIC(18,8);
```

### Phase 2: Backend Changes

#### 2.1 User Repository Updates
**File**: `backend/src/repositories/user.repository.ts`

Add methods:
- `updatePassword(userId: string, passwordHash: string): Promise<void>`
- `updateDefaultCurrency(userId: string, currency: string): Promise<void>`
- `findByIdWithPassword(id: string): Promise<UserWithPassword | null>` (for password verification)

#### 2.2 User Types
**File**: `backend/src/types/index.ts`

Update User interface:
```typescript
export interface User {
  id: string;
  email: string;
  display_name: string;
  default_currency: string;  // Add this
  created_at: Date;
}

export interface UserWithPassword extends User {
  password_hash: string;
}
```

#### 2.3 Account Types Update
**File**: `backend/src/types/index.ts`

```typescript
export interface Account {
  id: string;
  user_id: string;
  name: string;
  currency: string;  // Add this
  created_at: Date;
  updated_at: Date;
}
```

#### 2.4 Entry Types Update
**File**: `backend/src/types/index.ts`

```typescript
export interface MoneyEntry {
  // ... existing fields
  currency: string;           // Add this
  converted_amount: number | null;  // Add this
  exchange_rate: number | null;     // Add this
}
```

#### 2.5 XE API Service (NEW)
**File**: `backend/src/services/xe.service.ts`

```typescript
export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}

export const xeService = {
  async getExchangeRate(from: string, to: string): Promise<number>;
  async convertAmount(amount: number, from: string, to: string): Promise<{ convertedAmount: number; rate: number }>;
};
```

- Use XE API (https://xecdapi.xe.com/) for live rates
- Cache rates for reasonable duration (e.g., 1 hour)
- Handle API errors gracefully with fallback

#### 2.6 User Settings Controller (NEW)
**File**: `backend/src/controllers/user.controller.ts`

Endpoints:
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me/password` - Change password
- `PUT /api/users/me/currency` - Update default currency

#### 2.7 User Settings Routes (NEW)
**File**: `backend/src/routes/user.routes.ts`

```typescript
router.get('/me', authenticate, userController.getProfile);
router.put('/me/password', authenticate, userController.changePassword);
router.put('/me/currency', authenticate, userController.updateCurrency);
```

#### 2.8 Validation Schemas (NEW)
**File**: `backend/src/schemas/user.schema.ts`

```typescript
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export const updateCurrencySchema = z.object({
  currency: z.string().length(3).toUpperCase(),
});
```

#### 2.9 Account Repository/Controller Updates
- Update `create` to accept currency
- Update `update` to accept currency
- Include currency in responses

#### 2.10 Entry Repository/Service Updates
- Update `create` to accept currency, call XE API for conversion if different from account currency
- Update `update` similarly
- Store converted_amount and exchange_rate for audit

### Phase 3: Frontend Changes

#### 3.1 User Types Update
**File**: `frontend/src/types/index.ts`

```typescript
export interface User {
  id: string;
  email: string;
  displayName: string;
  defaultCurrency: string;  // Add this
  createdAt?: string;       // Add this
}
```

#### 3.2 Account Types Update
**File**: `frontend/src/types/index.ts`

```typescript
export interface Account {
  id: string;
  name: string;
  currency: string;  // Add this
  createdAt: string;
  updatedAt: string;
}
```

#### 3.3 Entry Types Update
**File**: `frontend/src/types/index.ts`

```typescript
export interface MoneyEntry {
  // ... existing fields
  currency: string;              // Add this
  convertedAmount: number | null;  // Add this
  exchangeRate: number | null;     // Add this
}
```

#### 3.4 User API Client (NEW)
**File**: `frontend/src/api/user.api.ts`

```typescript
export const userApi = {
  getProfile(): Promise<User>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  updateCurrency(currency: string): Promise<User>;
};
```

#### 3.5 Currency Utility (NEW)
**File**: `frontend/src/utils/currency.ts`

```typescript
// List of supported currencies
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'MXN', 'BRL', ...];

// Centralized currency formatting
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Currency selector options
export function getCurrencyOptions(): { value: string; label: string }[];
```

#### 3.6 Auth Context Update
**File**: `frontend/src/auth/AuthContext.tsx`

- Fetch full user profile on mount (instead of just decoding JWT)
- Add `updateUser` method to refresh user data after settings change
- Store `defaultCurrency` in context

#### 3.7 Profile Page (NEW)
**File**: `frontend/src/pages/ProfilePage.tsx`

Layout:
- Page header "Profile Settings"
- Section: Account Information (email, display name - read only)
- Section: Password Change form
  - Current password
  - New password
  - Confirm new password
  - Submit button
- Section: Currency Settings
  - Default currency dropdown
  - Save button

#### 3.8 Currency Selector Component (NEW)
**File**: `frontend/src/components/ui/CurrencySelector.tsx`

Reusable dropdown component for selecting currencies.

#### 3.9 Sidebar Update
**File**: `frontend/src/components/layout/Sidebar.tsx`

Add "Profile" or "Settings" link to the sidebar navigation.

#### 3.10 App Routes Update
**File**: `frontend/src/App.tsx`

Add route:
```typescript
<Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
```

#### 3.11 Update All Pages with Currency Formatting
Replace hardcoded USD formatting with centralized utility:

**Files to update** (8 pages):
1. `frontend/src/pages/DashboardPage.tsx`
2. `frontend/src/pages/AccountsPage.tsx`
3. `frontend/src/pages/ExpensesPage.tsx`
4. `frontend/src/pages/IncomePage.tsx`
5. `frontend/src/pages/TransfersPage.tsx`
6. `frontend/src/pages/RecurringPage.tsx`
7. `frontend/src/pages/BudgetsPage.tsx`
8. `frontend/src/pages/ForecastPage.tsx`

For entries/transactions: use entry's currency
For accounts: use account's currency
For aggregated views: use user's default currency (with conversion if needed)

#### 3.12 Account Form Updates
**Files**: `frontend/src/pages/AccountsPage.tsx` (modal forms)

- Add currency selector to create account form
- Add currency selector to edit account form

#### 3.13 Entry Form Updates
**Files**: Entry forms in Expenses, Income, Transfers pages

- Add currency selector (default to selected account's currency)
- Show conversion preview if currency differs from account

---

## Source Code Structure Changes

### New Files
```
backend/
├── src/
│   ├── controllers/user.controller.ts     # NEW
│   ├── routes/user.routes.ts              # NEW
│   ├── schemas/user.schema.ts             # NEW
│   ├── services/xe.service.ts             # NEW
│   └── services/user.service.ts           # NEW (optional, for business logic)
├── migrations/
│   ├── XXX_add_user_default_currency.sql  # NEW
│   ├── XXX_add_account_currency.sql       # NEW
│   └── XXX_add_entry_currency.sql         # NEW

frontend/
├── src/
│   ├── api/user.api.ts                    # NEW
│   ├── components/ui/CurrencySelector.tsx # NEW
│   ├── pages/ProfilePage.tsx              # NEW
│   └── utils/currency.ts                  # NEW
```

### Modified Files
```
backend/
├── src/
│   ├── repositories/user.repository.ts   # Add update methods
│   ├── repositories/account.repository.ts # Handle currency
│   ├── repositories/entry.repository.ts  # Handle currency, conversion
│   ├── controllers/accounts.controller.ts # Include currency
│   ├── controllers/entries.controller.ts  # Include currency, conversion
│   ├── schemas/account.schema.ts          # Add currency field
│   ├── schemas/entry.schema.ts            # Add currency field
│   ├── types/index.ts                     # Update all interfaces
│   └── routes/index.ts                    # Register user routes

frontend/
├── src/
│   ├── auth/AuthContext.tsx               # Full user profile, updateUser
│   ├── types/index.ts                     # Update interfaces
│   ├── components/layout/Sidebar.tsx      # Add profile link
│   ├── App.tsx                            # Add profile route
│   ├── pages/DashboardPage.tsx            # Use currency utility
│   ├── pages/AccountsPage.tsx             # Currency in forms + display
│   ├── pages/ExpensesPage.tsx             # Currency in forms + display
│   ├── pages/IncomePage.tsx               # Currency in forms + display
│   ├── pages/TransfersPage.tsx            # Currency in forms + display
│   ├── pages/RecurringPage.tsx            # Use currency utility
│   ├── pages/BudgetsPage.tsx              # Use currency utility
│   └── pages/ForecastPage.tsx             # Use currency utility
```

---

## Data Model Changes

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| default_currency | VARCHAR(3) | User's default currency (default: 'USD') |

### Accounts Table
| Column | Type | Description |
|--------|------|-------------|
| currency | VARCHAR(3) | Account's currency (default: 'USD') |

### Money Entries Table
| Column | Type | Description |
|--------|------|-------------|
| currency | VARCHAR(3) | Entry's original currency (default: 'USD') |
| converted_amount | NUMERIC(12,2) | Amount converted to account currency (nullable) |
| exchange_rate | NUMERIC(18,8) | Exchange rate used for conversion (nullable) |

---

## API Changes

### New Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/users/me | Get current user profile | Required |
| PUT | /api/users/me/password | Change password | Required |
| PUT | /api/users/me/currency | Update default currency | Required |

### Modified Endpoints

| Method | Path | Changes |
|--------|------|---------|
| POST | /api/accounts | Accept currency in body |
| PUT | /api/accounts/:id | Accept currency in body |
| GET | /api/accounts | Return currency in response |
| POST | /api/entries | Accept currency, return conversion data |
| PUT | /api/entries/:id | Accept currency, return conversion data |
| GET | /api/entries/* | Return currency, converted_amount, exchange_rate |

### Request/Response Examples

#### Change Password
```json
// PUT /api/users/me/password
// Request
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass456"
}
// Response
{ "message": "Password changed successfully" }
```

#### Update Currency
```json
// PUT /api/users/me/currency
// Request
{ "currency": "EUR" }
// Response
{
  "id": "...",
  "email": "user@example.com",
  "displayName": "John Doe",
  "defaultCurrency": "EUR",
  "createdAt": "..."
}
```

#### Create Entry with Different Currency
```json
// POST /api/entries
// Request
{
  "type": "expense",
  "accountId": "...",
  "categoryId": "...",
  "amount": 100,
  "currency": "EUR",  // Entry is in EUR
  "description": "Lunch in Paris",
  "entryDate": "2024-01-15"
}
// Response (account is in USD)
{
  "id": "...",
  "amount": 100,
  "currency": "EUR",
  "convertedAmount": 108.50,  // Converted to USD
  "exchangeRate": 1.085,
  // ... other fields
}
```

---

## XE API Integration

### API Details
- **Endpoint**: `https://xecdapi.xe.com/v1/convert_from.json`
- **Authentication**: API key (Account ID + API Key as HTTP Basic Auth)
- **Rate Limits**: Varies by plan (free tier: 1000 requests/month)

### Implementation Notes
1. Store XE API credentials in environment variables:
   - `XE_ACCOUNT_ID`
   - `XE_API_KEY`

2. Cache exchange rates in memory or database for 1 hour to minimize API calls

3. Fallback strategy if XE API fails:
   - Log error
   - Return error to user (don't silently fail with wrong rates)
   - Consider storing last known rates as backup

4. Conversion logic:
   ```typescript
   // When creating/updating entry
   if (entry.currency !== account.currency) {
     const rate = await xeService.getExchangeRate(entry.currency, account.currency);
     entry.converted_amount = entry.amount * rate;
     entry.exchange_rate = rate;
   } else {
     entry.converted_amount = entry.amount;
     entry.exchange_rate = 1;
   }
   ```

---

## Verification Approach

### Backend Tests
1. Unit tests for user repository new methods
2. Unit tests for XE service (with mocked API responses)
3. Integration tests for new API endpoints
4. Test password change with correct/incorrect current password
5. Test currency validation (must be valid 3-letter code)

### Frontend Tests
1. Profile page renders correctly
2. Password change form validation
3. Currency selector functionality
4. Currency formatting utility tests

### Manual Verification
1. Create account with non-USD currency
2. Create entry in different currency than account
3. Verify conversion is correct
4. Change password successfully
5. Change default currency and verify it persists
6. Check all pages display correct currencies

### Build & Lint
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

---

## Security Considerations

1. **Password Change**: Always verify current password before allowing change
2. **Rate Limiting**: Consider adding rate limiting to password change endpoint
3. **XE API Key**: Store in environment variables, never commit
4. **Validation**: Validate currency codes against allowed list
5. **SQL Injection**: Use parameterized queries (already pattern in codebase)

---

## Edge Cases

1. **Transfer between accounts with different currencies**:
   - Convert from source account currency to destination account currency
   - Store both original and converted amounts

2. **Recurring entries with currency**:
   - Generated instances inherit currency from parent
   - Re-conversion on each generation (rates may change)

3. **Balance calculations**:
   - Account balance uses converted_amount (in account's currency)
   - Dashboard totals convert to user's default currency

4. **Currency change on existing account**:
   - Option 1: Disallow if entries exist (simpler)
   - Option 2: Re-convert all entries (complex, data integrity concerns)
   - **Recommendation**: Option 1 initially

---

## Implementation Order

1. Database migrations (can be done first, all columns have defaults)
2. Backend type updates
3. XE service implementation
4. User repository/controller/routes
5. Account repository updates (currency support)
6. Entry repository updates (currency + conversion)
7. Frontend types and utility
8. User API client
9. Profile page
10. Currency selector component
11. Account forms update
12. Entry forms update
13. Update all pages with currency formatting
14. Auth context update (full profile fetch)
15. Sidebar + routing updates
