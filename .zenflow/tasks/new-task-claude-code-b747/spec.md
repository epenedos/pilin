# Technical Specification: Account Dialog with Currency and Initial Balance

## Task Summary

Convert account creation and update from inline forms to an independent modal dialog. Add currency selection during creation (immutable after creation) and initial balance functionality that creates/updates an income entry with type "other".

## Difficulty Assessment: **Medium**

**Rationale:**
- Multiple interconnected components need modification (frontend dialog, API, backend logic)
- Initial balance feature requires creating/linking income entries to accounts
- Edge cases around currency immutability and initial balance updates
- Requires coordination between account and entry systems
- No architectural changes needed - follows existing patterns

---

## Technical Context

**Language/Framework:**
- Frontend: React 18 + TypeScript, Tailwind CSS
- Backend: Node.js + Express + TypeScript, PostgreSQL
- Validation: Zod schemas

**Key Dependencies:**
- Existing Modal component (`frontend/src/components/ui/Modal.tsx`)
- CurrencySelector component (`frontend/src/components/ui/CurrencySelector.tsx`)
- Accounts API client (`frontend/src/api/accounts.api.ts`)
- Entries API for initial balance (`frontend/src/api/entries.api.ts`)

---

## Implementation Approach

### Overview

1. **Create AccountDialog component** - Reusable modal for create/edit account operations
2. **Add "Other" income category** - For initial balance entries (or use existing system)
3. **Modify API** - Support initial balance in create/update, return linked entry info
4. **Backend changes** - Handle initial balance entry creation/updates atomically
5. **Update AccountsPage** - Replace inline forms with dialog triggers

### Design Decisions

**Initial Balance Strategy:**
- Create a special income entry when setting initial balance
- Link entry to account via a new `initial_balance_entry_id` column on accounts
- Entry uses category type "other" (need to ensure this category exists)
- Entry description: "Initial Balance"
- Entry date: Account creation date (or user-specified)

**Currency Immutability:**
- Currency field editable only during creation
- Disabled/hidden in edit mode
- Backend enforces this constraint

---

## Source Code Structure Changes

### Files to Create

#### `frontend/src/components/accounts/AccountDialog.tsx`
```typescript
interface AccountDialogProps {
  open: boolean;
  onClose: () => void;
  account?: AccountWithBalance | null;  // null = create mode, object = edit mode
  onSaved: () => void;
}
```

**Features:**
- Modal wrapper using existing Modal component
- Account name input (required)
- Currency selector (required, disabled in edit mode)
- Initial balance input (optional, number)
- Save/Cancel buttons
- Loading state during API calls

### Files to Modify

#### Frontend

| File | Changes |
|------|---------|
| `frontend/src/pages/AccountsPage.tsx` | Remove inline forms, add dialog state, trigger buttons |
| `frontend/src/api/accounts.api.ts` | Add `initialBalance` to create/update payloads |
| `frontend/src/types/index.ts` | Extend Account type with `initialBalanceEntryId` (optional) |

#### Backend

| File | Changes |
|------|---------|
| `backend/src/schemas/account.schema.ts` | Add `initialBalance` to create/update schemas |
| `backend/src/controllers/accounts.controller.ts` | Handle initial balance entry creation/update |
| `backend/src/repositories/account.repository.ts` | Add `initial_balance_entry_id` handling |
| `backend/src/types/index.ts` | Add `initial_balance_entry_id` to Account type |

#### Database

| File | Changes |
|------|---------|
| New migration: `backend/migrations/XXX_add_initial_balance_entry.sql` | Add `initial_balance_entry_id` column to accounts |

---

## Data Model Changes

### Accounts Table

Add column:
```sql
ALTER TABLE accounts
ADD COLUMN initial_balance_entry_id UUID REFERENCES money_entries(id) ON DELETE SET NULL;
```

### API Contract Changes

#### Create Account Request
```typescript
{
  name: string;           // required
  currency: string;       // required (3-char ISO code)
  initialBalance?: number; // optional, defaults to no entry
}
```

#### Create Account Response
```typescript
{
  id: string;
  name: string;
  currency: string;
  initialBalanceEntryId?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Update Account Request
```typescript
{
  name?: string;           // optional
  // currency NOT allowed (immutable)
  initialBalance?: number; // optional, updates existing entry or creates new
}
```

---

## Interface Changes

### AccountDialog Component

**Create Mode:**
- Title: "Add Account"
- Name input: empty, focused
- Currency selector: enabled, default USD
- Initial Balance input: empty (optional)
- Save button: "Create Account"

**Edit Mode:**
- Title: "Edit Account"
- Name input: prefilled
- Currency: displayed as read-only text (not editable)
- Initial Balance input: prefilled if exists (from linked entry)
- Save button: "Save Changes"

### AccountsPage Changes

- Remove inline create form at top
- Add "Add Account" button at top
- Remove inline edit mode (Edit button opens dialog)
- Each account card: Edit button opens dialog in edit mode

---

## Backend Logic

### Create Account with Initial Balance

```typescript
async createAccount(userId, { name, currency, initialBalance }) {
  // 1. Create the account
  const account = await accountRepo.create({ userId, name, currency });

  // 2. If initialBalance provided and > 0
  if (initialBalance && initialBalance > 0) {
    // Find or create "Other" income category
    const category = await findOrCreateOtherCategory(userId);

    // Create income entry
    const entry = await entryRepo.create({
      userId,
      accountId: account.id,
      categoryId: category.id,
      type: 'income',
      amount: initialBalance,
      currency: currency,
      description: 'Initial Balance',
      entryDate: new Date().toISOString().split('T')[0],
    });

    // Link entry to account
    await accountRepo.setInitialBalanceEntry(account.id, entry.id);
    account.initialBalanceEntryId = entry.id;
  }

  return account;
}
```

### Update Account Initial Balance

```typescript
async updateAccount(userId, accountId, { name, initialBalance }) {
  const account = await accountRepo.findById(accountId);

  // Update name if provided
  if (name) {
    await accountRepo.update(accountId, { name });
  }

  // Handle initial balance changes
  if (initialBalance !== undefined) {
    if (account.initialBalanceEntryId) {
      if (initialBalance > 0) {
        // Update existing entry amount
        await entryRepo.update(account.initialBalanceEntryId, { amount: initialBalance });
      } else {
        // Delete entry if balance set to 0
        await entryRepo.delete(account.initialBalanceEntryId);
        await accountRepo.setInitialBalanceEntry(accountId, null);
      }
    } else if (initialBalance > 0) {
      // Create new entry
      const category = await findOrCreateOtherCategory(userId);
      const entry = await entryRepo.create({ ... });
      await accountRepo.setInitialBalanceEntry(accountId, entry.id);
    }
  }
}
```

### Currency Immutability Enforcement

```typescript
// In updateAccountSchema - remove currency field entirely
updateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  initialBalance: z.number().min(0).optional(),
  // NO currency field
});
```

---

## "Other" Category Handling

Need to ensure an "Other" income category exists for initial balance entries:

**Option 1 (Recommended):** Create system categories during user registration
- Add "Other" category (income) with a predefined ID pattern
- Categories created in seed or migration

**Option 2:** Find-or-create pattern
- Check if user has "Other" income category
- Create if not exists
- Store reference for future use

For this implementation, use Option 2 as it's safer and doesn't require migration of existing users.

---

## Verification Approach

### Manual Testing

1. **Create Account Without Initial Balance:**
   - Open dialog, enter name, select currency
   - Save → Account created with no linked entry
   - Verify balance shows as 0

2. **Create Account With Initial Balance:**
   - Open dialog, enter name, currency, initial balance (e.g., 1000)
   - Save → Account created
   - Verify balance shows 1000
   - Check income entries page for "Initial Balance" entry

3. **Edit Account Name:**
   - Click edit on existing account
   - Verify currency is not editable
   - Change name, save
   - Verify name updated

4. **Edit Initial Balance:**
   - Edit account with initial balance
   - Change amount → Verify entry updated
   - Set to 0 → Verify entry deleted
   - Add initial balance to account that had none → Verify entry created

5. **Currency Immutability:**
   - Try to edit account currency via API directly → Should fail

### Build Verification

```bash
cd frontend && npm run build
cd backend && npm run build
```

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Orphaned initial balance entries | Use foreign key with ON DELETE SET NULL |
| Race conditions in create flow | Use database transaction |
| Missing "Other" category | Find-or-create pattern ensures it exists |
| Currency changes via direct API | Backend validation rejects currency in update |

---

## Out of Scope

- Multi-currency initial balances (entry uses account currency)
- Initial balance date selection (uses current date)
- Batch initial balance updates
- Import initial balances from external sources
