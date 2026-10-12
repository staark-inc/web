# Staark Hub — Unified Workspace Design Contract

Status: **implementation contract for PR #103**. Scope: `staark-inc/web` Hub UI only. Target branch: `dev`.

This document is the design decision record for the ongoing migration. It does **not** refer to the customer website themes in `staark-inc/nextjs` (SaaS Runtime / Custom Runtime). Those projects are out of scope.

## 1. Product and visual direction

**Staark Workspace:** compact, calm operations UI. Keep the identity that already exists; stop redesigning each module independently.

- Light application canvas (`--sw-bg: #f6f8fb`), white surfaces (`--sw-surface: #fff`), dark readable text (`--sw-ink: #172238`), subdued metadata (`--sw-muted: #62718a`), quiet dividers (`--sw-line: #dfe6f0`).
- Blue primary accent (`--sw-accent: #315cf5`) is reserved for primary actions, active navigation and visible focus.
- Dark sidebar is a deliberate shell contrast, not a separate set of arbitrary module colors.
- Dense but breathable: common 4px spacing scale with typical 8 / 12 / 16 / 24 / 32px steps and shared card radius (`--sw-radius: 14px`). Prefer useful content over oversized blank areas.
- Legible typography, accessible contrast, unmistakable focus, no meaning communicated by color alone.
- **One default visual theme first.** A future dark-content theme must override **semantic tokens**, not duplicate per-page stylesheets. Do not introduce a theme switcher until the canonical light contract is complete.

## 2. Single ownership model

| Concern | Source of truth | Rule |
| --- | --- | --- |
| Design tokens and shared component styles | `app/hub/theme.css` | One semantic `--sw-*` token vocabulary; eliminate competing `--hub-vN-*` and patch-specific variables |
| Shared presentational primitives | `components/hub/workspace.tsx`, `components/hub/WorkspaceTabs.tsx`, and future `components/hub/ui/*` | Reuse existing components; each primitive has one implementation |
| Global shell | `app/hub/(dashboard)/layout.tsx`, `HubSidebar.tsx`, `HubNav.tsx`, `HubWorkspaceHeader.tsx` | Shared sidebar, toolbar, content area, mobile behavior |
| Page-specific composition | `app/hub/(dashboard)/**` | Compose primitives, own data loading and business actions; avoid reimplementing common controls |
| Legacy module styles | Existing `app/hub/*.css` | Temporary migration inputs, **not** new sources of tokens/components |
| Public website | Outside `app/hub` | Explicitly out of scope |

“One source of truth” means one **contract and owner per concern**, not putting the entire app into one gigantic CSS file. As modules migrate, separate component structure and module-specific layouts from tokens. `theme.css` remains the canonical entrypoint for shared Hub styling during this PR.

**Prefix contract:** `sw-*` for shared workspace primitives; stable `hub-*` for shell and truly module-specific legacy classes awaiting migration. No numbered suffix/prefix (`-v2`, `-v3`, `-v4`, `-v7`, `-v100`). State uses `is-active`, `is-loading`, or accessible ARIA/data attributes, not version numbers.

## 3. Shared UI components (reuse before building)

| Canonical capability | Current building block | Target contract |
| --- | --- | --- |
| Page canvas / content width | `WorkspacePage` | One responsive content frame; no independent max-width per page |
| Page heading and CTA | `PageHeader` | Eyebrow, title, short description, actions |
| Section heading | `SectionHeader` | Consistent section hierarchy and spacing |
| Metric cards | `Metrics` + `Metric` | One grid and visual treatment across dashboards |
| Tabs / status filters | `WorkspaceTabs` | Horizontal compact tabs with counts; mobile scroll, accessible active state |
| Record list | `RecordList` + `RecordRow` | Consistent list row, identity, metadata, primary link |
| Status / badges | `InfoChip` | Semantic neutral / info / success / warning; add danger as needed |
| Empty / no results | `EmptyState` | Title, explanation, actionable recovery |
| Buttons / action links | Existing varied buttons | **Unify** into `Button` / `ActionLink` / `IconButton` with primary, secondary, quiet, danger, disabled/loading/focus states |
| Card / detail sections | Existing `sw-*` panels | **Unify** `Panel` / `DetailSection`; no custom card for each module |
| Search and actions | Existing per-page toolbars | **Unify** `FilterBar` + `SearchField`; prevent full-width filter wasteland |
| Form controls | Existing forms | **Unify** `FormField`, `SelectField`, `TextAreaField`, help/error text |
| Operations tables | Existing rows/cards | **Unify** `DataTable`, with mobile alternatives; retain semantic table markup where appropriate |
| Confirmation / feedback | Existing dialogs and notifications | **Unify visual rules** for `ConfirmDialog`, `Toast`, `InlineAlert`; preserve working behavior |
| History / communications | Existing Inbox/Threads/Offer events | **Unify visual rules** for `Timeline`, `MessagePanel`; preserve complex interaction logic |

**Important:** “Target contract” is the component backlog inside this same PR; it does not imply these new React exports already exist. Avoid creating unused components for appearances. Migrate a real screen when adding each primitive.

## 4. Page templates

1. **Overview/operations**: `PageHeader` → compact metrics → priorities/alerts → useful activity panels.
2. **Collection** (Prospects, Leads, Clients, Projects, Offers, Billing, Support, SaaS): `PageHeader` → optional metrics → `FilterBar`/`WorkspaceTabs` → record grid/table → empty state/pagination.
3. **Detail/workflow** (lead/client/project/offer/subscription/inbox thread): compact title + status/actions → main details → contextual sidebar or timeline.
4. **Settings/form**: page heading → section navigation if needed → focused forms and feedback; do not create a different form design for each settings page.

Only one **global shell header**, plus one **page header**. The shell provides navigation/breadcrumb context; the page provides purpose and actions.

## 5. Responsive and accessibility

- Check **375, 768, and 1440px** first; ensure no horizontal body overflow at 320px as an additional stress check.
- On mobile, navigation is a keyboard-usable disclosure, filter rows can scroll horizontally without expanding the page, and record/table layouts stack or scroll deliberately.
- 44px touch targets where feasible; no clipped dialogs/popovers; Escape and focus restoration for interactive overlays.
- `:focus-visible`, reduced-motion, readable contrast and meaningful semantic labels are part of shared primitives.
- Avoid large empty panels and nested duplicate cards on desktop.

## 6. Migration inside PR #103 (commits, not more PRs)

- **A — Foundation and contract:** record the token/component/template decisions; enforce a “no *new* vN identifier” rule on PR changes while old names are migrated.
- **B — Shell:** sidebar, global header, spacing/content, mobile layout, notification surface; stabilize current `hub-*` naming.
- **C — Shared primitives:** consolidate buttons, chips, cards, filters, fields, tables; move reusable rules into shared ownership.
- **D — Module adoption:** Overview, Communication, Prospects/Opportunities/Leads/Contacts, Clients/Projects/Offers, Billing/Support/SaaS, Profile/Settings. Migrate class references **and CSS selectors together**.
- **E — Retire legacy:** remove old imports/files only after inspecting all consumers, pseudo-states and breakpoints; remove stale `page.bkp.tsx` and obsolete fixture styling when confirmed safe; make the vN check strict across the Hub.
- **F — Real-page verification:** compare authenticated Hub routes against their existing appearance and flows on desktop/mobile. CI remains normal GitHub Actions. The old `test/fixtures/hub-ui-page.tsx` fixture is **not** the visual source of truth: it still uses an old Projects structure.

Forbid new `*-vN.css`, `*-fix.css`, `*-polish.css` files and repeated “one last override” patches. Preserve existing flows and data: no Prisma schema, auth bypass, billing/provisioning operations, or SaaS Runtime changes.

## 7. Definition of done

- No numbered version selectors/custom properties in Hub UI source; no orphaned duplicate component implementations.
- Shared tokens applied to page surfaces, text, lines, borders, focus and primary actions; no newly introduced one-off hardcoded palette for general-purpose components.
- Every major Hub page follows its designated shared template; sidebar/header/filter/button/panel hierarchy feels like one product.
- All live user flows continue working (Inbox/Sent/Compose, prospects → leads → offers, projects, billing, support, settings).
- Real authenticated pages verified at 375 / 768 / 1440px, plus current CI. Fixture-only success does not count as design approval.
- **Only then merge PR #103 to `dev`.** Production release is a separate explicit decision.
