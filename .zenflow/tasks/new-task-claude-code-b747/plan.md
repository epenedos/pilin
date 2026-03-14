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
<!-- chat-id: 78426f5c-64e7-478b-b995-a09b1585197e -->

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

---

### [ ] Step: Database Migration and Backend Types

Add `initial_balance_entry_id` column to accounts table and update backend types.

- Create migration file `backend/migrations/XXX_add_initial_balance_entry.sql`
- Add `initial_balance_entry_id UUID REFERENCES money_entries(id) ON DELETE SET NULL` to accounts
- Update `backend/src/types/index.ts` to include `initial_balance_entry_id` in Account interface
- Run migration: `cd backend && npm run migrate`
- Verify with `npm run build`

---

### [ ] Step: Backend API Changes

Modify account schemas, repository, and controller to support initial balance.

- Update `backend/src/schemas/account.schema.ts`:
  - Add `initialBalance: z.number().min(0).optional()` to createAccountSchema
  - Add `initialBalance: z.number().min(0).optional()` to updateAccountSchema
  - Remove `currency` from updateAccountSchema (immutable)
- Update `backend/src/repositories/account.repository.ts`:
  - Add `setInitialBalanceEntry(accountId, entryId)` method
  - Modify `findById` to return `initial_balance_entry_id`
  - Update mapping to include `initialBalanceEntryId`
- Update `backend/src/controllers/accounts.controller.ts`:
  - In `create`: handle initialBalance by creating income entry with "Other" category
  - In `update`: handle initialBalance changes (create/update/delete entry)
  - Add helper to find-or-create "Other" income category
- Verify with `cd backend && npm run build`

---

### [ ] Step: Frontend AccountDialog Component

Create the AccountDialog modal component for create/edit operations.

- Create `frontend/src/components/accounts/AccountDialog.tsx`
  - Props: `open`, `onClose`, `account` (optional), `onSaved`
  - Use existing Modal component as wrapper
  - Include: name input, CurrencySelector (disabled in edit), initialBalance input
  - Handle create vs edit mode based on `account` prop
  - Currency field: show as dropdown in create, read-only text in edit
  - Loading state during API submission
  - Call accounts API create/update on submit
- Update `frontend/src/types/index.ts` with `initialBalanceEntryId` field
- Update `frontend/src/api/accounts.api.ts` to include initialBalance in payloads
- Verify with `cd frontend && npm run build`

---

### [ ] Step: Integrate AccountDialog into AccountsPage

Replace inline forms with dialog-based create/edit flow.

- Update `frontend/src/pages/AccountsPage.tsx`:
  - Remove inline creation form at top
  - Add "Add Account" button that opens AccountDialog in create mode
  - Remove inline edit mode state and UI
  - Modify Edit button to open AccountDialog in edit mode
  - Keep delete functionality with ConfirmDialog (unchanged)
  - Pass selected account to dialog, handle onSaved to refresh list
- Test all CRUD operations work through the dialog
- Verify with `cd frontend && npm run build`

---

### [ ] Step: Final Integration and Testing

End-to-end verification and cleanup.

- Test complete flows:
  - [ ] Create account without initial balance
  - [ ] Create account with initial balance → verify income entry created
  - [ ] Edit account name only
  - [ ] Edit account initial balance → verify entry updated
  - [ ] Set initial balance to 0 → verify entry deleted
  - [ ] Add initial balance to existing account
  - [ ] Verify currency cannot be changed after creation
- Run final builds: `cd frontend && npm run build && cd ../backend && npm run build`
- Write report to `{@artifacts_path}/report.md`
