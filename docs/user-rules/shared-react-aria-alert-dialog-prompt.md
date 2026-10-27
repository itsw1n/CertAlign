# Shared React Aria Alert Dialog — Inspection, Standardization, and Migration Prompt

Can you inspect the existing project first and determine whether a shared confirmation / Alert Dialog implementation already exists?

Do **not** immediately create a new component.

First search the codebase for:

```text
AlertDialog
ConfirmAction
ConfirmDialog
Dialog
DialogTrigger
ModalOverlay
alertdialog
role="alertdialog"
Approve
Reject
Delete
Remove
Cancel
Complete
react-aria-components
```

Inspect especially:

```text
src/components/
src/components/layout/
src/components/common/
src/components/ui/
src/features/
src/app/
```

Also inspect:

- existing confirmation dialogs
- existing destructive actions
- existing approve/reject flows
- button styles
- danger/destructive styles
- overlay/backdrop styles
- dialog surface styles
- Lucide icons
- loading states
- Server Actions
- permissions
- installed `react-aria-components` version
- existing design tokens
- accessibility behavior

This is a **standardization/refactor task**, not a redesign.

Preserve existing visual design, business logic, actions, permissions, validation, loading states, and feature behavior.

---

# 1. Determine Whether an Alert Dialog Already Exists

If a suitable generic confirmation component already exists:

- inspect it first
- improve/refactor it where needed
- reuse it as the canonical Alert Dialog

Do **not** create another competing confirmation component.

If the existing generic component is named something like:

```text
ConfirmAction.tsx
ConfirmDialog.tsx
```

and its responsibility is clearly a confirmation / alert dialog, prefer standardizing it as:

```text
AlertDialog.tsx
```

when the rename is safe.

Update all references if renamed.

If no suitable shared component exists, create:

```text
src/components/layout/alert-dialog/AlertDialog.tsx
```

Keep it as one file initially.

Do not automatically create:

```text
AlertDialogHeader.tsx
AlertDialogBody.tsx
AlertDialogActions.tsx
AlertDialogOverlay.tsx
index.ts
```

unless existing project conventions clearly justify them.

---

# 2. Alert Dialog Responsibility

Use the Alert Dialog for actions that require explicit confirmation.

Examples:

```text
Approve?
Reject?
Delete?
Remove?
Cancel?
Complete?
Archive?
Deactivate?
```

Conceptually:

```text
Alert Dialog
│
├── Overlay / Backdrop
│
└── Alert Dialog Container
    │
    ├── Title
    ├── Description / message
    │
    └── Actions
        ├── Cancel
        └── Confirm / destructive action
```

Example:

```text
┌─────────────────────────────────┐
│ Remove availability?            │
│                                 │
│ Are you sure you want to        │
│ remove this availability?       │
│                                 │
│ Cancel                 Remove   │
└─────────────────────────────────┘
```

This is different from a normal Create/Edit/View Modal.

---

# 3. Preserve Alert Dialog Semantics

Use React Aria Components and the API supported by the project's installed version.

Preserve proper alert-dialog semantics.

Conceptually:

```tsx
<Dialog role="alertdialog">
```

or the current React Aria equivalent.

Do not downgrade this to a normal dialog if the interaction is an important confirmation.

React Aria should handle appropriate:

```text
focus behavior
keyboard behavior
dialog semantics
screen-reader semantics
modal interaction
```

Do not manually recreate behavior React Aria already provides.

---

# 4. Alert Dialog vs Standard Modal

Keep Alert Dialog and standard Modal as separate concepts.

Use:

```text
Modal
→ Create
→ Add
→ Edit
→ View
→ Details
```

Use:

```text
AlertDialog
→ Approve
→ Reject
→ Delete
→ Remove
→ Cancel
→ Complete
```

Do not force the standard Modal's structure into AlertDialog.

In particular, do not automatically add:

```text
X close button
standard modal header
feature form body
scrollable feature-content structure
```

unless the existing UX explicitly requires it.

An Alert Dialog should focus the user's attention on making a confirmation decision.

---

# 5. No X Button by Default

Do not add an X close button by default.

Preferred structure:

```text
┌─────────────────────────────────┐
│ Delete user?                    │
│                                 │
│ This action cannot be undone.   │
│                                 │
│ Cancel                  Delete  │
└─────────────────────────────────┘
```

The user should normally dismiss through:

```text
Cancel
```

or complete the action through:

```text
Confirm / Delete / Approve / etc.
```

If the existing project has an intentional X-close pattern for confirmation dialogs, preserve that behavior only after inspecting why it exists.

---

# 6. Dynamic Content

The shared AlertDialog must not hardcode:

```text
Delete
Approve
Reject
Remove
Cancel consultation
Complete consultation
```

Feature usage supplies the content.

Conceptual API:

```ts
type AlertDialogProps = {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isPending?: boolean;
  variant?: "default" | "danger";
};
```

Adapt this API to the existing project's patterns.

Do not add props without a real use case.

---

# 7. Example Usages

Approve:

```tsx
<AlertDialog
  title="Approve consultation?"
  description="This will approve the consultation request."
  confirmLabel="Approve"
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  onConfirm={handleApprove}
/>
```

Delete:

```tsx
<AlertDialog
  title="Delete user?"
  description="This action cannot be undone."
  confirmLabel="Delete"
  variant="danger"
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  onConfirm={handleDelete}
/>
```

Reject:

```tsx
<AlertDialog
  title="Reject request?"
  description="The request will be marked as rejected."
  confirmLabel="Reject"
  variant="danger"
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  onConfirm={handleReject}
/>
```

The shared component owns HOW the confirmation UI behaves.

The feature owns WHAT action is being confirmed.

---

# 8. Trigger Ownership

Do not assume the shared AlertDialog must own the trigger button.

Support the architecture that best matches the existing project.

For example, either:

```text
feature button
→ controls isOpen
→ AlertDialog
```

or an existing safe `DialogTrigger` composition pattern.

Do not force one trigger pattern if the existing project already has a clean, consistent approach.

The key rule is:

```text
AlertDialog
→ generic confirmation UI

Feature
→ decides when to open it
```

---

# 9. Confirm and Cancel Buttons

The Alert Dialog should clearly distinguish:

```text
Cancel
Confirm
```

For dangerous actions:

```text
Cancel
Delete / Remove / Reject
```

Reuse the project's existing shared Button component if one exists.

Preserve existing button variants such as:

```text
default
secondary
danger
destructive
```

Do not invent a new button design system.

---

# 10. Pending / Loading State

When the confirmation action is running:

```text
isPending = true
```

the Alert Dialog should prevent duplicate submissions.

Possible behavior:

```text
disable confirm button
show existing project loading indicator
optionally disable cancel while mutation is in critical progress
```

Follow the project's established behavior.

Do not allow repeated clicks to trigger the same destructive action multiple times.

Do not replace the entire dialog unnecessarily during loading.

---

# 11. Error Handling

The shared AlertDialog should not interpret API/business errors.

The feature/action layer owns the actual error meaning.

If the existing design displays an error inside the dialog, allow feature-provided error content/message.

Conceptually:

```ts
errorMessage?: string
```

or:

```tsx
errorContent?: React.ReactNode
```

Do not make `AlertDialog.tsx`:

```text
call APIs
interpret HTTP codes
perform database operations
decide business error messages
```

---

# 12. Design System

Preserve the existing project's visual language.

Inspect and reuse:

```text
overlay color
surface color
border
radius
shadow
title typography
description typography
button spacing
danger color
focus state
hover state
disabled state
loading state
```

If the existing project already uses tokens such as:

```text
primary
surface
border
foreground
muted
danger
focus
shadow-dialog
```

reuse them.

React Aria provides behavior/accessibility.

The existing system provides appearance.

Do not create a separate React-Aria-specific design.

---

# 13. Overlay / Background Behavior

The Alert Dialog should behave as a true modal confirmation.

Expected behavior:

```text
background dimmed
background interaction blocked
focus kept within confirmation context
keyboard behavior handled correctly
dialog appears above application content
```

Preserve the existing backdrop design where one already exists.

Do not redesign the overlay unnecessarily.

---

# 14. Dismiss Behavior

Be careful with accidental dismissal for destructive/important actions.

Inspect the existing behavior before deciding whether clicking outside should close the Alert Dialog.

For important confirmations, prefer intentional dismissal through:

```text
Cancel
```

rather than accidental outside-click dismissal.

Do not blindly enable `isDismissable` for all alert dialogs.

Use the project's intended UX and React Aria semantics.

---

# 15. Dynamic Variants

Support only variants that actual project use cases require.

A simple pattern may be:

```ts
variant?: "default" | "danger"
```

Example:

```text
Approve
→ default / positive action

Delete
→ danger

Remove
→ danger

Reject
→ danger depending on project semantics
```

Do not create excessive variants for every feature.

The feature supplies the wording.

The shared AlertDialog supplies visual treatment.

---

# 16. Do Not Put Business Logic in AlertDialog

Do not put:

```text
approveConsultation()
deleteUser()
rejectRequest()
removeAvailability()
database calls
Server Actions
permissions
authorization
API requests
feature-specific validation
```

inside the shared AlertDialog.

Correct responsibility:

```text
Feature
→ owns action

AlertDialog
→ asks for confirmation

Feature action
→ executes after confirm
```

---

# 17. Authorization Remains Server-Side

Do not treat hiding a destructive button or Alert Dialog as authorization.

Existing server-side authorization must remain intact.

Example:

```text
UI permission
+
server authorization
```

The Alert Dialog is only presentation/interaction.

Do not move authorization logic into it.

---

# 18. Migration Strategy for Existing Projects

Use this sequence:

```text
1. Inspect all existing confirmation dialogs
2. Determine whether they share the same pattern
3. Inspect existing design tokens/buttons
4. Create/refactor canonical AlertDialog
5. Migrate one representative confirmation flow
6. Verify behavior
7. Continue migrating equivalent confirmation dialogs
8. Preserve specialized dialogs with genuinely different needs
9. Remove old generic confirmation components only after confirming they are unused
```

Do not perform blind global replacement.

---

# 19. Rename Existing ConfirmAction Safely

If the project currently has:

```text
ConfirmAction.tsx
```

and it is clearly a generic alert-dialog component:

Prefer:

```text
AlertDialog.tsx
```

because the name matches the actual UI/accessibility pattern.

When renaming:

```text
update imports
update references
preserve props/behavior where possible
run typecheck
confirm no stale references remain
```

Do not rename purely for aesthetics if it would cause unnecessary risk in a large system.

---

# 20. Avoid Duplicate Confirmation Systems

After migration, avoid equivalent generic components such as:

```text
ConfirmAction.tsx
ConfirmDialog.tsx
AlertDialog.tsx
ConfirmationModal.tsx
DeleteDialog.tsx
```

when they all perform the same generic confirmation role.

Prefer one canonical AlertDialog.

Feature-specific wrappers are acceptable when they add meaningful feature context.

Example:

```text
DeleteUserDialog
→ uses shared AlertDialog
→ supplies user-specific wording/action
```

---

# 21. Accessibility Verification

Verify:

```text
✓ correct alert-dialog semantics
✓ title is accessible
✓ description is accessible where present
✓ focus enters the dialog correctly
✓ keyboard navigation works
✓ buttons have meaningful text
✓ destructive action is clearly identified
✓ screen reader receives appropriate semantics
```

Do not rely only on visual styling.

---

# 22. Functional Verification

Verify:

```text
✓ opens correctly
✓ cancel closes correctly
✓ confirm runs exactly once
✓ pending state prevents duplicate action
✓ successful action closes when intended
✓ errors preserve appropriate user feedback
✓ permissions/business logic unchanged
✓ destructive variant looks clear
✓ background interaction blocked
```

---

# 23. Responsive Verification

Verify on:

```text
desktop
tablet
mobile
```

Ensure:

```text
dialog fits viewport
message remains readable
buttons remain reachable
no horizontal clipping
long text wraps correctly
```

Alert Dialog content should normally be concise enough that complex internal scrolling is unnecessary.

If unusually long content exists, handle it carefully without turning the confirmation dialog into a normal content-heavy Modal.

---

# 24. Run Project Validation

Run the project's existing:

```text
lint
type-check
tests
build
```

where available.

Fix issues caused by this refactor.

Do not perform unrelated cleanup.

---

# 25. Final Report

After implementation, report:

```text
Existing confirmation implementation found:
- ...

Canonical AlertDialog:
- ...

Renamed:
- ...

Created:
- ...

Updated:
- ...

Migrated confirmation flows:
- ...

Variants used:
- ...

Removed obsolete implementations:
- ...

Left unchanged intentionally:
- ...

Validation:
- lint
- type-check
- tests
- build
```

---

# Final Architecture Rule

The final system should follow:

```text
FEATURE
│
├── action button
├── business action
├── permission logic
└── action-specific wording
        ↓
   AlertDialog
        │
        ├── alertdialog semantics
        ├── title
        ├── description
        ├── Cancel
        ├── Confirm
        ├── danger/default styling
        └── pending interaction
```

Use AlertDialog for important confirmation decisions.

Keep it separate from the standard Create/Edit/View Modal.

Keep business logic inside features/server layers.

Keep the shared AlertDialog focused on generic confirmation UI, accessibility, and interaction.
