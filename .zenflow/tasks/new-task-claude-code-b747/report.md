# Implementation Report: Account Dialog with Initial Balance

## Summary

This task implemented a dialog-based account creation/editing system with currency selection and initial balance support. The key changes allow users to:

1. Create accounts through a modal dialog instead of inline forms
2. Select currency during account creation (immutable after creation)
3. Set an optional initial balance that creates an income entry with "Other" category
4. Update the initial balance on existing accounts

## Implementation Details

### Database Changes

**Migration**: `backend/migrations/012_add_initial_balance_entry.sql`
- Added `initial_balance_entry_id UUID REFERENCES money_entries(id) ON DELETE SET NULL` column to accounts table
- Created index for efficient lookups

### Backend Changes

**Schema** (`backend/src/schemas/account.schema.ts`):
- `createAccountSchema`: Added `initialBalance: z.number().min(0).optional()`
- `updateAccountSchema`: Added `initialBalance: z.number().min(0).optional()`, removed currency (immutable)

**Repository** (`backend/src/repositories/account.repository.ts`):
- Added `setInitialBalanceEntry(id, userId, entryId)` method
- Updated `findById` and `findAllByUser` to return `initial_balance_entry_id`
- Added proper mapping in `mapAccountRow`

**Controller** (`backend/src/controllers/accounts.controller.ts`):
- `create`: Handles `initialBalance` by creating income entry with "Other" category
- `update`: Handles initial balance changes (create/update/delete entry based on value)
- Helper `findOrCreateOtherIncomeCategory`: Finds or creates "Other" income category
- Helper `createInitialBalanceEntry`: Creates income entry with description "Initial Balance"

### Frontend Changes

**Types** (`frontend/src/types/index.ts`):
- Added `initialBalanceEntryId?: string | null` to `Account` interface

**API** (`frontend/src/api/accounts.api.ts`):
- Updated `create` to accept `initialBalance?: number`
- Updated `update` to accept `initialBalance?: number`

**API** (`frontend/src/api/entries.api.ts`):
- Added `getById(id)` method to fetch individual entries

**AccountDialog** (`frontend/src/components/accounts/AccountDialog.tsx`):
- New modal component for create/edit operations
- Props: `open`, `onClose`, `account` (optional), `onSaved`
- Features:
  - Name input field
  - Currency selector (enabled in create mode, disabled in edit mode)
  - Initial balance input field
  - Loading states and error handling
  - Fetches existing initial balance when editing

**AccountsPage** (`frontend/src/pages/AccountsPage.tsx`):
- Removed inline creation form
- Added "Add Account" button that opens AccountDialog
- Modified Edit button to open AccountDialog in edit mode
- Retained delete functionality with ConfirmDialog

## Test Scenarios

The following scenarios should be tested manually:

### Account Creation

1. **Create account without initial balance**
   - Click "Add Account"
   - Enter name, select currency
   - Leave initial balance empty
   - Click "Create Account"
   - Expected: Account created, no income entry created

2. **Create account with initial balance**
   - Click "Add Account"
   - Enter name, select currency
   - Enter initial balance (e.g., 1000)
   - Click "Create Account"
   - Expected: Account created, income entry with "Other" category created, balance reflected

### Account Editing

3. **Edit account name only**
   - Click "Edit" on existing account
   - Modify name only
   - Click "Save Changes"
   - Expected: Name updated, initial balance unchanged

4. **Edit account initial balance (existing balance)**
   - Click "Edit" on account with initial balance
   - Change initial balance value
   - Click "Save Changes"
   - Expected: Initial balance entry updated, balance reflected

5. **Set initial balance to 0 (remove)**
   - Click "Edit" on account with initial balance
   - Set initial balance to 0
   - Click "Save Changes"
   - Expected: Initial balance entry deleted, account balance adjusted

6. **Add initial balance to existing account**
   - Click "Edit" on account without initial balance
   - Enter initial balance value
   - Click "Save Changes"
   - Expected: New income entry created with "Other" category

### Currency Immutability

7. **Verify currency cannot be changed after creation**
   - Click "Edit" on existing account
   - Expected: Currency field is disabled/read-only
   - Expected: Helper text says "Currency cannot be changed after account creation"

## Build Verification

Both frontend and backend builds pass successfully:

```
Backend: npm run build ✓
Frontend: npm run build ✓
```

## Files Modified

### Backend
- `backend/migrations/012_add_initial_balance_entry.sql` (new)
- `backend/src/schemas/account.schema.ts`
- `backend/src/repositories/account.repository.ts`
- `backend/src/controllers/accounts.controller.ts`
- `backend/src/types/index.ts`

### Frontend
- `frontend/src/components/accounts/AccountDialog.tsx` (new)
- `frontend/src/pages/AccountsPage.tsx`
- `frontend/src/types/index.ts`
- `frontend/src/api/accounts.api.ts`
- `frontend/src/api/entries.api.ts`

## Notes

- The initial balance entry uses the "Other" income category, which is created automatically if it doesn't exist
- Currency is immutable after account creation to maintain data integrity
- Setting initial balance to 0 removes the associated income entry
- The dialog properly loads existing initial balance values when editing
