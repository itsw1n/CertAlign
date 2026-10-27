# Shared React Aria Select — Inspection, Standardization, and Migration Prompt

Can you inspect the existing project first and determine whether a shared Select/Dropdown implementation already exists?

Do **not** immediately create a new component.

First search the codebase for:

```text
Select
ListBox
Popover
<select>
dropdown
filter
department filter
status filter
role filter
category filter
type filter
react-aria-components
```

Inspect especially:

```text
src/components/
src/components/ui/
src/components/layout/
src/features/
src/app/
```

Also inspect:

- the existing design system
- Tailwind classes/tokens
- button/input styles
- form field styles
- Lucide icons
- `cn()` or styling utilities
- installed `react-aria-components` version
- existing forms
- existing filter controls
- URL/local state patterns
- Server Action form submission behavior
- any existing action menus

This is a **standardization/refactor task**, not a redesign.

Preserve the existing application design and feature behavior.

---

# 1. Determine Whether a Shared Select Already Exists

If a suitable shared Select already exists:

- inspect it first
- improve/refactor it if necessary
- reuse it as the canonical Select

Do **not** create a competing generic Select.

If no suitable shared Select exists, create:

```text
src/components/ui/select/Select.tsx
```

Keep it as one file initially.

Do not automatically create:

```text
SelectTrigger.tsx
SelectItem.tsx
SelectList.tsx
SelectPopover.tsx
ListBox.tsx
SelectContext.tsx
useSelect.ts
index.ts
```

unless the existing architecture clearly justifies them.

---

# 2. Shared Select Responsibility

The shared Select owns generic single-value selection UI and behavior:

```text
Select
├── Trigger/Button
│   ├── currently selected value
│   └── chevron
│
└── Popover
    └── ListBox
        ├── ListBoxItem
        ├── ListBoxItem
        └── ...
```

The shared Select owns:

```text
trigger
selected-value display
open/closed chevron
popover
listbox
selected-item checkmark
focus/hover styling
disabled styling
keyboard/accessibility behavior
dynamic option rendering
```

The shared Select must **not** own:

```text
feature-specific filtering logic
database access
API calls
Server Actions
business logic
permissions
hardcoded departments
hardcoded roles
hardcoded statuses
hardcoded categories
URL-state semantics
```

Those remain feature-owned.

---

# 3. React Aria

Use React Aria Components and the API supported by the installed version.

Use the appropriate current primitives, conceptually:

```text
Select
Button
SelectValue
Popover
ListBox
ListBoxItem
```

Do not manually recreate keyboard navigation, focus handling, listbox semantics, selected-state behavior, or accessibility behavior that React Aria already provides.

Adapt the implementation to the project's installed `react-aria-components` version rather than copying outdated syntax.

---

# 4. Trigger Behavior

The rectangle showing the currently selected value is the Select trigger.

Closed:

```text
┌────────────────────────┐
│ All departments     ˅  │
└────────────────────────┘
```

Open:

```text
┌────────────────────────┐
│ All departments     ^  │
└────────────────────────┘
```

Required behavior:

```text
closed → ChevronDown
open   → ChevronUp
```

Use React Aria's open/render state where possible.

Do not introduce duplicate local state only to control the chevron if React Aria already exposes the state.

---

# 5. Selected Value Behavior

If the selected value is `IT`:

```text
┌────────────────────────┐
│ IT                  ˅  │
└────────────────────────┘
```

When reopened:

```text
┌────────────────────────┐
│ IT                  ^  │
└────────────────────────┘
┌────────────────────────┐
│ All departments        │
│ Education              │
│ IT                   ✓ │
│ Math                   │
└────────────────────────┘
```

Requirements:

- the trigger updates to the selected label
- the selected item remains in the option list
- selected item receives selected styling
- selected item shows a check icon on the right
- choosing one item does not remove other options

Use the project's existing Lucide icon library if available.

---

# 6. Popover / ListBox Width

The Popover/ListBox must match the width of the Select trigger.

Correct:

```text
┌────────────────────────┐
│ IT                  ^  │
└────────────────────────┘
┌────────────────────────┐
│ All departments        │
│ Education              │
│ IT                   ✓ │
│ Math                   │
└────────────────────────┘
```

Do not make the dropdown arbitrarily wider or narrower than the trigger.

Prefer React Aria's trigger-width CSS variable where supported.

Conceptually:

```tsx
<Popover className="w-[var(--trigger-width)]">
```

Use the exact syntax supported by the installed version and the project's Tailwind/CSS setup.

Do not hardcode a separate fixed width.

The Select itself should remain flexible:

```tsx
<Select className="w-40" ... />
<Select className="w-64" ... />
<Select className="w-full" ... />
```

The Popover should automatically follow the trigger width.

---

# 7. Dynamic Options

The shared Select must not hardcode application values.

Use a generic option shape similar to:

```ts
type SelectOption = {
  id: string;
  label: string;
  isDisabled?: boolean;
};
```

Conceptual props:

```ts
type SelectProps = {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  isDisabled?: boolean;
  className?: string;
  name?: string;
};
```

Only add additional props if they solve actual project requirements.

Options may come from:

```text
static feature constants
server-loaded data
database-backed data
API data
form configuration
```

The shared Select only renders what is supplied.

---

# 8. Filter Selects — Contextual “All ...” Option

For filter Selects, prefer contextual reset labels instead of a vague `All`.

Examples:

```text
All departments
All teams
All statuses
All roles
All categories
All papers
All types
```

Example:

```tsx
<Select
  defaultValue="all"
  options={[
    { id: "all", label: "All departments" },
    { id: "education", label: "Education" },
    { id: "it", label: "IT" },
    { id: "math", label: "Math" },
  ]}
/>
```

Initial state:

```text
┌────────────────────────┐
│ All departments     ˅  │
└────────────────────────┘
```

After selecting IT:

```text
┌────────────────────────┐
│ IT                  ˅  │
└────────────────────────┘
```

Reopened:

```text
┌────────────────────────┐
│ IT                  ^  │
└────────────────────────┘
┌────────────────────────┐
│ All departments        │
│ Education              │
│ IT                   ✓ │
│ Math                   │
└────────────────────────┘
```

The contextual `All ...` option must remain available after another option is selected.

Selecting it again should restore the unfiltered state through the feature's existing filter logic.

The shared Select must **not** contain filtering/business logic.

---

# 9. Do Not Auto-Generate “All ...”

Do not implement generic logic such as:

```ts
"All " + selectName
```

inside the shared Select.

The feature should provide the exact wording.

Good:

```ts
{ id: "all", label: "All departments" }
```

Good:

```ts
{ id: "all", label: "All teams" }
```

This avoids awkward wording and keeps the component generic.

---

# 10. Form Selects Are Different

For actual form fields, do not automatically include an `All ...` option.

Example:

```text
Department
┌────────────────────────┐
│ Select department   ˅  │
└────────────────────────┘
```

Options:

```text
Education
IT
Math
BSA
```

Rule:

```text
FILTER
→ contextual “All ...” option

FORM FIELD
→ placeholder such as “Select department”
```

The shared Select must support both use cases.

---

# 11. Native Form Participation

If the existing system uses Server Actions/native form submission, preserve that behavior.

Support a `name` prop where necessary so the selected value participates correctly in form submission.

Do not introduce React Hook Form solely for this Select migration if the project does not already use it.

If the project already uses React Hook Form, integrate with the existing form approach instead of creating a second state system.

---

# 12. Selected / Focused / Disabled States

Support visual states for:

```text
normal trigger
open trigger
focused trigger
disabled trigger

normal option
focused/hovered option
selected option
selected + focused option
disabled option
```

Selected option should have:

```text
selected background/text treatment
check icon on the right
```

Focused/hovered items should use the existing design system's interactive background treatment.

Use React Aria render props/data attributes where appropriate.

Do not manually recreate focus or selected-state logic.

---

# 13. Long Option Lists

The ListBox/Popover must have a sensible maximum height.

If options become numerous:

```text
┌────────────────────────┐
│ All departments        │
│ Education              │
│ IT                     │
│ Math                   │
│ ...                    │
│ ...                    │
│              ↕ scroll  │
└────────────────────────┘
```

Use vertical scrolling inside the options container.

Do not allow the dropdown to grow beyond the viewport.

---

# 14. Preserve Existing Design System

Inspect and reuse the project's existing:

```text
control height
spacing
font size
font weight
text colors
muted colors
border colors
surface/background colors
focus rings
hover states
selected states
disabled states
border radius
shadow
icon sizes
```

If the project already has a common control pattern such as:

```text
min-h-11
rounded-lg
border border-border
bg-surface
px-3
outline-none
focus-visible:ring-3
focus-visible:ring-focus
```

reuse that visual language where appropriate.

React Aria provides behavior/accessibility.

The existing project provides appearance.

Do not create a separate "React Aria design".

---

# 15. Width Flexibility

Do not hardcode one Select width.

Allow the feature/page to control width through the project's normal class/style mechanism.

Examples:

```tsx
<Select className="w-40" ... />
<Select className="w-64" ... />
<Select className="w-full" ... />
```

The dropdown must still match the trigger width.

---


# Responsive Width, Min Width, Max Width, and Flex Shrinking

Inspect the existing Select layout for width problems before changing styles.

A common failure case is:

```text
┌──────────────────────┐
│ All departments   ˅  │
└──────────────────────┘

┌──────────────┐
│ All ye... ˅  │
└──────────────┘
```

where a Select is squeezed by its parent flex layout and the selected label becomes unnecessarily truncated.

The goal is:

```text
┌──────────────────────┐
│ All departments   ˅  │
└──────────────────────┘

┌──────────────────┐
│ All years     ˅  │
└──────────────────┘
```

## Terminology

`min-width` means the component may become wider, but should not become narrower than the specified value.

`max-width` means the component may become narrower, but should not become wider than the specified value.

Do not confuse these with a fixed `width`.

The shared Select should remain flexible rather than enforcing one width for every use case.

## Shared Select Width Rule

The shared Select should:

- accept `className`
- allow the feature/page to determine its width
- make the trigger fill the Select's available width
- make the Popover/ListBox match the trigger width
- avoid hardcoding feature-specific widths
- preserve safe text-overflow behavior for unusually long labels

Conceptually:

```tsx
<Select className={className}>
  <Button className="w-full">
    ...
  </Button>

  <Popover className="w-[var(--trigger-width)]">
    ...
  </Popover>
</Select>
```

Use the exact React Aria/Tailwind syntax supported by the project.

## Feature-Level Minimum Width

For filter controls, the feature may provide an appropriate minimum width based on expected labels.

Examples only:

```tsx
<Select className="min-w-44" ... /> // All departments
<Select className="min-w-36" ... /> // All years
```

Do not hardcode these semantic widths inside `Select.tsx`.

The feature owns layout sizing.

## Flex Container Behavior

When multiple filter Selects are placed in a horizontal flex row, the container should normally allow wrapping rather than squeezing controls until labels truncate.

Prefer a layout conceptually like:

```tsx
<div className="flex flex-wrap gap-3">
  ...
</div>
```

For controls that should keep a readable minimum size, use the project's appropriate flex sizing such as:

```text
min-width
flex-none / shrink-0 when appropriate
```

Do not blindly add `shrink-0` everywhere if it causes mobile overflow.

Desired behavior:

```text
Enough horizontal space:

[ All departments ˅ ] [ All years ˅ ]

Not enough horizontal space:

[ All departments ˅ ]
[ All years       ˅ ]
```

Avoid:

```text
[ All departments ˅ ] [ All ye... ˅ ]
```

## Mobile / Narrow Screens

Do not solve desktop truncation by introducing horizontal overflow on small screens.

Prefer:

- flex wrapping
- responsive widths
- `w-full` where appropriate on mobile
- feature-level `min-width`
- `max-width: 100%` where appropriate

The shared Select should remain compatible with patterns such as:

```tsx
<Select className="w-full sm:w-auto sm:min-w-44" ... />
```

or the project's equivalent responsive convention.

## Selected Label Truncation

Inspect whether the trigger currently uses:

```text
truncate
text-ellipsis
overflow-hidden
whitespace-nowrap
```

Do not remove truncation blindly.

Truncation may remain as a final safety mechanism for genuinely long values, but normal contextual labels such as:

```text
All departments
All years
All statuses
```

should have enough layout width to display fully under normal conditions.

Fix layout/minimum width first rather than simply removing overflow protection.

## Popover Width Must Still Match

Any responsive/min-width changes must preserve:

```text
trigger width = Popover/ListBox width
```

Do not independently size the option box.

## Verification

Verify:

```text
✓ normal filter labels are not unnecessarily truncated
✓ Selects keep a readable minimum width
✓ filter controls wrap when horizontal space is insufficient
✓ mobile layout does not overflow
✓ trigger remains flexible
✓ Popover/ListBox still matches trigger width
✓ unusually long labels still fail safely
✓ changing selected value does not unexpectedly break layout
```


# 16. Search / Filter State Ownership

The Select should not decide how URL state or local filtering works.

Feature state may live in:

```text
local component state
URL search params
nuqs
existing store
React Hook Form
native form state
```

Preserve the existing ownership.

The Select simply reports the selected value.

---

# 17. Do Not Replace Action Menus With Select

A dropdown-like control such as:

```text
⋯
├── View
├── Edit
└── Delete
```

is **not** a Select.

That is an action Menu.

Use appropriate React Aria menu semantics:

```text
MenuTrigger
→ Popover
→ Menu
→ MenuItem
```

The shared Select is for choosing values such as:

```text
Department
Team
Status
Role
Category
Type
Filter
```

Do not migrate action menus into Select.

---

# 18. Migration Strategy for Existing Projects

Use this sequence:

```text
1. Inspect existing Select/dropdown implementations
2. Inspect existing state/data ownership
3. Inspect existing design system
4. Identify duplicated single-value Select patterns
5. Create/refactor canonical shared Select
6. Migrate one representative usage
7. Verify state/form/filter behavior
8. Continue migrating appropriate usages
9. Remove obsolete duplicate implementations only when confirmed unused
```

Do not perform a blind global replacement.

Do not replace specialized controls that genuinely have different semantics.

---

# 19. Verification

Verify:

```text
✓ trigger displays current selected value
✓ closed state shows ChevronDown
✓ open state shows ChevronUp
✓ Popover/ListBox width matches trigger
✓ options render dynamically
✓ selected item remains in the list
✓ selected item shows a checkmark
✓ focused/hovered state is visible
✓ disabled option works
✓ disabled Select works
✓ long lists scroll
✓ keyboard navigation works
✓ controlled values work
✓ default values work
✓ contextual All ... option remains available for filters
✓ form Select uses placeholder instead of inappropriate All option
✓ native form/Server Action submission still works where applicable
✓ existing URL/local-state filtering remains intact
✓ responsive layout remains correct
```

Run the project's existing:

```text
lint
type-check
tests
build
```

where available.

Fix issues caused by this refactor only.

---

# 20. Final Report

After implementation, report:

```text
Existing Select implementation found:
- ...

Canonical shared Select:
- ...

Created:
- ...

Updated:
- ...

Migrated Select usages:
- ...

Filter Selects:
- ...

Form Selects:
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
├── option data
├── selected value
├── filtering meaning
├── URL/form/local state
└── business behavior
        ↓
   Shared Select
        │
        ├── trigger
        ├── selected value
        ├── chevron
        ├── popover
        ├── listbox
        ├── checkmark
        ├── focus/selected styling
        └── accessibility
```

Keep the shared Select generic.

Keep feature-specific data and business meaning inside the feature.

Use contextual `All ...` labels for filters.

Use placeholders for actual form fields.

Keep the dropdown width matched to the trigger.
