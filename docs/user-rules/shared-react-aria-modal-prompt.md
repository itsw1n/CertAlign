# Shared React Aria Modal and Alert Dialog — Inspection, Standardization, and Migration Prompt

Can you inspect the existing project first and determine whether shared Modal/Dialog or Alert Dialog implementations already exist?

Do **not** immediately create new components.

First search the codebase for:

```text
Modal
ModalOverlay
Dialog
alertdialog
ConfirmAction
AlertDialog
DialogTrigger
Create modal
Edit modal
View modal
Details modal
react-aria-components
```

Inspect especially:

```text
src/components/
src/components/layout/
src/components/common/
src/features/
src/app/
```

Also inspect:

- the existing design system
- Tailwind classes/tokens
- modal overlays/backdrops
- dialog surface styles
- Lucide icons
- button styles
- focus/keyboard behavior
- existing Create/Edit/View/Add/Details dialogs
- existing confirmation dialogs
- installed `react-aria-components` version
- existing form flows
- existing loading/error/success behavior

This is a **standardization/refactor task**, not a redesign.

Preserve the existing visual system and existing feature behavior.

---

# 1. Determine Whether a Shared Modal Already Exists

If a suitable standard shared Modal already exists:

- inspect it first
- improve/refactor it if necessary
- reuse it as the canonical normal Modal

Do **not** create a competing generic Modal.

If no suitable shared Modal exists, create:

```text
src/components/layout/modal/Modal.tsx
```

Keep it as one file initially.

Do not automatically create:

```text
ModalHeader.tsx
ModalBody.tsx
ModalOverlay.tsx
ModalContent.tsx
index.ts
```

unless the existing architecture clearly justifies them.

---

# 2. Standard Modal vs Alert Dialog

Treat these as two different UI patterns.

## Standard Modal

Use for normal feature interfaces such as:

```text
Create
Add
Edit
View
Details
```

Example:

```text
┌──────────────────────────────┐
│ Edit Availability         X  │
├──────────────────────────────┤
│ feature-specific content     │
│                              │
└──────────────────────────────┘
```

## Alert Dialog

Use for confirmation/important action prompts such as:

```text
Approve?
Reject?
Delete?
Remove?
Cancel?
Complete?
```

Example:

```text
┌──────────────────────────────┐
│ Remove availability?         │
│                              │
│ Are you sure you want to     │
│ remove this availability?    │
│                              │
│ Cancel              Remove   │
└──────────────────────────────┘
```

The Alert Dialog should preserve:

```tsx
role="alertdialog"
```

or the correct React Aria equivalent for the installed version.

Do not force the normal Modal's title/X header pattern onto confirmation dialogs unless the project's UX explicitly requires that behavior.

If the project currently has a generic confirmation component named something like:

```text
ConfirmAction.tsx
```

and its responsibility is clearly an alert/confirmation dialog, prefer renaming/standardizing it as:

```text
AlertDialog.tsx
```

provided the rename is safe and all references are updated.

Do not create unnecessary abstraction underneath Modal and AlertDialog unless real repeated complexity justifies it.

---

# 3. Shared Standard Modal Responsibility

The shared Modal controls generic modal behavior and layout:

```text
Modal
│
├── Overlay / Backdrop
│   ├── dimmed background
│   ├── block interaction behind modal
│   └── positioning
│
└── Dialog Container
    │
    ├── Header
    │   ├── dynamic title
    │   └── X close button
    │
    └── Scrollable Content
        └── feature-specific children
```

Use React Aria Components and the API supported by the installed version.

React Aria should handle the appropriate:

```text
dialog semantics
focus management
keyboard behavior
modal interaction behavior
accessibility
```

Do not manually recreate behavior already provided by React Aria.

---

# 4. Critical Rule — Modal Header Must Never Scroll

The standard Modal header must remain visible at all times.

Only the feature-specific content underneath the header may scroll.

Expected behavior:

```text
┌─────────────────────────────────────┐
│ Create User                      X  │ ← never scrolls
├─────────────────────────────────────┤
│                                     │
│ Name                                │
│ [...............................]   │
│                                     │
│ Email                               │
│ [...............................]   │
│                                     │
│ Department                          │
│ [...............................]   │
│                                     │
│ more feature-specific content       │
│                                     │
│             ↕ scroll                │ ← only this area
│                                     │
└─────────────────────────────────────┘
```

Required layout behavior:

```text
Dialog
→ display flex
→ flex-direction column
→ constrained maximum height

Header
→ shrink-0
→ never scrolls

Content
→ min-height: 0
→ flex: 1
→ overflow-y-auto
```

Conceptually:

```tsx
<Dialog className="flex max-h-[...] flex-col">
  <header className="shrink-0">
    ...
  </header>

  <div className="min-h-0 flex-1 overflow-y-auto">
    {children}
  </div>
</Dialog>
```

Use the project's actual styling conventions rather than copying these classes blindly.

The important requirement is:

```text
header stays fixed inside modal
content scrolls independently
```

Do **not** place `overflow-y-auto` on the entire Dialog if that makes the header scroll away.

---

# 5. Standard Modal Header

The header must consistently contain:

```text
LEFT                            RIGHT
Dynamic Title                  X
```

Example:

```text
┌─────────────────────────────────────┐
│ Edit User                        X  │
└─────────────────────────────────────┘
```

Requirements:

- title top-left
- X button top-right
- title is dynamic
- X uses the project's existing icon library
- X has an accessible label such as `Close`
- correct React Aria dialog-title semantics
- header uses existing spacing/colors/borders/typography
- header never scrolls

Do not hardcode feature titles inside the shared Modal.

---

# 6. Dynamic Modal Content

The shared Modal must accept arbitrary feature-specific content through `children`.

Conceptual API:

```ts
type ModalProps = {
  title: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
};
```

Only add additional props if they solve real project needs.

Example:

```tsx
<Modal
  title="Create User"
  isOpen={isOpen}
  onOpenChange={setIsOpen}
>
  <UserForm />
</Modal>
```

Edit:

```tsx
<Modal
  title="Edit User"
  isOpen={isOpen}
  onOpenChange={setIsOpen}
>
  <UserForm
    mode="edit"
    user={user}
  />
</Modal>
```

View:

```tsx
<Modal
  title="View Inventory"
  isOpen={isOpen}
  onOpenChange={setIsOpen}
>
  <InventoryDetails item={item} />
</Modal>
```

Rule:

```text
Shared Modal
→ owns HOW the modal behaves

Feature
→ owns WHAT appears inside it
```

The shared Modal must know nothing about feature-specific business/data logic.

---

# 7. Width and Size Flexibility

Do not hardcode one modal width for every use case.

Support a sensible default plus feature-controlled sizing through the project's existing styling system.

Examples:

```text
small details modal
→ max-w-lg

larger form
→ max-w-3xl
```

Conceptually:

```tsx
<Modal className="max-w-lg" ... />
<Modal className="max-w-3xl" ... />
```

Preserve existing widths where migrating existing dialogs.

Do not redesign feature layouts unnecessarily.

---

# 8. Modal Overlay / Background Behavior

The shared Modal should handle the normal modal experience:

```text
dim backdrop
modal above application content
background interaction blocked
background page not behaving normally while modal is open
focus/keyboard behavior
Escape/dismiss behavior according to project intent
responsive sizing
maximum viewport height
```

Preserve the existing application's backdrop appearance if one already exists.

Do not redesign the overlay simply because the implementation is being standardized.

---

# 9. Preserve Existing Design System

Inspect and reuse existing:

```text
overlay color
surface color
border color
border radius
shadow
spacing
header height
font size
font weight
close button style
hover state
focus state
mobile spacing
```

If the project already has tokens such as:

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

The existing project provides appearance.

Do not create a separate "React Aria modal design".

---

# 10. Alert Dialog Responsibility

If the project has a confirmation dialog component, standardize it separately as an Alert Dialog.

Suggested path:

```text
src/components/layout/alert-dialog/AlertDialog.tsx
```

or preserve an existing suitable location if project conventions differ.

Use it for important confirmations such as:

```text
Approve
Reject
Delete
Remove
Cancel
Complete
```

The Alert Dialog may contain:

```text
title
description/message
cancel action
confirm/destructive action
```

It should preserve appropriate alert-dialog semantics.

Do not automatically add:

```text
standard modal X header
dismiss-anywhere behavior
feature form content
```

to the Alert Dialog.

Confirmation UX should remain intentional.

---

# 11. Alert Dialog Visual Consistency

Modal and AlertDialog may share the same existing visual language:

```text
same backdrop
same surface
same radius
same border
same shadow
same buttons
same typography
```

But they remain separate components because their semantics and interaction patterns differ.

Do not merge them merely to reduce file count.

---

# 12. Migrate Existing Modal-Like UI

Search existing features for interfaces such as:

```text
Create
Add
Edit
Update
View
Details
```

Determine which are already modal-like or clearly intended to become standard modals.

Examples:

```text
Users
├── Create
├── Edit
└── View

Inventory
├── Create
├── Edit
└── View
```

Do not blindly convert normal pages into modals.

Only migrate interfaces where the modal pattern is appropriate.

Feature-specific content stays in the feature.

Example:

```text
features/users/components/
├── UserForm.tsx
├── CreateUserModal.tsx
└── EditUserModal.tsx
```

Composition:

```tsx
<Modal title="Create User" ...>
  <UserForm />
</Modal>
```

Do not move feature forms into the shared Modal file.

---

# 13. Migrate Existing Confirmation Dialogs

Search for ad-hoc confirmation dialogs such as:

```text
ConfirmAction
Delete confirmation
Approve confirmation
Reject confirmation
Cancel confirmation
Remove confirmation
```

If they represent the same alert-dialog pattern, migrate them to the canonical AlertDialog.

Preserve:

```text
role/semantics
button labels
destructive styling
business actions
permissions
loading behavior
error behavior
```

Do not turn confirmation dialogs into normal feature modals.

---

# 14. Preserve Existing Feature Behavior

When migrating any dialog, do not break or unnecessarily rewrite:

```text
form fields
Server Actions
Zod validation
loading states
errors
permissions
edit default values
view data
submit behavior
success behavior
close-after-success behavior
revalidation
business logic
```

This task is primarily about standardizing dialog UI and interaction.

Do not refactor unrelated backend/application architecture.

---

# 15. State Management

Do not introduce Zustand/global state only to open/close normal feature modals.

Local state is acceptable:

```ts
const [isOpen, setIsOpen] = useState(false);
```

Reuse existing state ownership if the feature already has an appropriate pattern.

Do not create a second state system.

---

# 16. Avoid Duplicate Modal Systems

After migration, avoid equivalent generic components such as:

```text
Modal.tsx
AppModal.tsx
SharedModal.tsx
BaseModal.tsx
CustomDialog.tsx
```

when they all do the same job.

Prefer one canonical standard Modal.

Similarly, avoid multiple equivalent confirmation components such as:

```text
ConfirmAction.tsx
ConfirmDialog.tsx
AlertDialog.tsx
DeleteDialog.tsx
```

when they all represent the same generic confirmation pattern.

However, preserve specialized dialogs that genuinely have different behavior.

Only remove old components after confirming they are no longer referenced.

---

# 17. Verification — Standard Modal

Verify:

```text
✓ opens correctly
✓ closes correctly
✓ title is top-left
✓ X is top-right
✓ X has accessible label
✓ header NEVER scrolls
✓ only feature-specific content scrolls
✓ long forms remain usable
✓ modal respects max viewport height
✓ feature-specific width can be preserved
✓ background interaction is blocked
✓ keyboard/focus behavior works
✓ Create/Edit/View/Add/Details flows still work
```

---

# 18. Verification — Alert Dialog

Verify:

```text
✓ alert-dialog semantics preserved
✓ confirmation title/message render correctly
✓ cancel action works
✓ confirm/destructive action works
✓ no unnecessary standard Modal header was introduced
✓ permissions/business actions remain unchanged
✓ destructive styling remains clear
```

---

# 19. Responsive Verification

Verify both dialog types on:

```text
desktop
tablet
small/mobile viewport
```

Ensure:

```text
modal remains inside viewport
content can scroll when necessary
header remains visible
buttons remain reachable
no horizontal clipping
```

---

# 20. Run Project Validation

Run the project's existing:

```text
lint
type-check
tests
build
```

where available.

Fix issues caused by this implementation/refactor.

Do not perform unrelated cleanup.

---

# 21. Final Report

After implementation, report:

```text
Existing standard Modal found:
- ...

Existing confirmation/alert dialog found:
- ...

Canonical standard Modal:
- ...

Canonical AlertDialog:
- ...

Created:
- ...

Updated:
- ...

Migrated standard dialogs:
- ...

Migrated alert dialogs:
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
STANDARD MODAL
→ Create / Add / Edit / View / Details
→ dynamic title + X
→ header never scrolls
→ only feature content scrolls

ALERT DIALOG
→ Approve / Reject / Delete / Remove / Cancel / Complete
→ confirmation-focused UI
→ alertdialog semantics
```

Keep normal Modals and Alert Dialogs visually consistent but semantically separate.

Keep feature-specific content and business logic inside features.

Keep the shared dialog components focused only on generic UI behavior and presentation.
