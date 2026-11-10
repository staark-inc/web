# Staark Hub Design System 2.0

Status: **UI-01 foundation implemented; pages still on the legacy compatibility facade.** Target branch: `dev`.

This document is the working contract for the Hub UI migration. It records the UI-00 architecture and the exact boundaries of UI-01. It does not authorise page redesign, schema changes, auth changes or production deployment.

## 1. Scope and baseline

- UI-00 baseline: `origin/dev` at `4b3e172` (`refactor(hub): unify detail pages and forms`).
- UI-01 is additive and targets `dev`.
- No page route, dashboard layout, authentication, MFA, Prisma, email or Stripe behavior changes.
- Existing `components/hub/workspace.tsx` exports remain the rendering facade for all current pages.
- Existing `WorkspaceTabs` markup and navigation behavior remain unchanged.
- All 29 legacy Hub stylesheets remain imported; no legacy stylesheet is deleted or restyled in UI-01.

The migration order is deliberate: tokens and primitives first, then shell, then page templates, then legacy CSS removal.

The isolated interactive approval surface is documented in [`hub-design-preview.md`](./hub-design-preview.md). It is not part of production navigation and must be approved before UI-02.

## 2. Token architecture

`app/hub/styles/tokens.css` is the canonical vocabulary. It keeps the current visual identity and expands the existing `--sw-*` values into a complete contract.

| Group | Tokens | Notes |
|---|---|---|
| Typography | `--sw-font-*`, `--sw-text-*`, `--sw-line-*`, `--sw-weight-*` | Minimum operational text is 12 px |
| Color | `--sw-bg`, `--sw-surface*`, `--sw-ink`, `--sw-body`, `--sw-muted`, `--sw-line*`, `--sw-accent*`, status colors, sidebar colors | Muted/body/status pairs meet WCAG AA on their intended surfaces |
| Focus | `--sw-focus-color`, `--sw-focus-ring`, `--sw-focus-width`, `--sw-focus-offset` | Used by every primitive |
| Space | `--sw-space-1` … `--sw-space-12` | 4 px base |
| Radius | `--sw-radius-sm`, `--sw-radius-md`, `--sw-radius-lg`, `--sw-radius-xl`, `--sw-radius-full` | `--sw-radius: 14px` remains the legacy alias |
| Elevation | `--sw-shadow-subtle`, `--sw-shadow-raised` | One restrained elevation language |
| Layout | `--sw-sidebar-width`, `--sw-sidebar-compact-width`, `--sw-topbar-height*`, `--sw-content-*`, `--sw-control-height`, `--sw-touch-target` | Shell values are defined now, consumed by UI-02 |
| Motion | `--sw-duration-*`, `--sw-easing-standard` | Disabled by the scoped reduced-motion layer |
| Breakpoints | `--sw-breakpoint-sm`, `--sw-breakpoint-md`, `--sw-breakpoint-lg`, `--sw-breakpoint-xl` | Documentation tokens; media queries use 480/768/1024/1280 px |

Token scope is `.hub-dashboard`, `.hub-login-page` and `[data-sw-ui]`. The legacy files still contain their historical `--sw-*` definitions until UI-02/UI-07 remove them; new code must treat `tokens.css` as authoritative.

## 3. CSS ownership model

| Layer | Owner | Allowed content |
|---|---|---|
| Tokens | `app/hub/styles/tokens.css` | Variables only |
| Base | `app/hub/styles/base.css` | Reset, typography, focus and reduced-motion rules under `@layer sw-base` and `[data-sw-ui]` |
| Primitives | `components/hub/ui/*.module.css` | Scoped component styles using `--sw-*` tokens |
| Templates | `components/hub/templates/*` (UI-03–UI-07) | Template layout and responsive composition |
| Pages | `app/hub/**/page.module.css` (UI-03–UI-07) | Route-unique layout only |
| Legacy | `app/hub/*.css` | Frozen except for controlled deletion after migration |

Rules:

1. New shared components must use CSS Modules, not global CSS.
2. A CSS Module must not target `.hub-*` or `.sw-*` selectors, use `:global`, or introduce `!important`.
3. New global CSS is limited to `tokens.css` and `base.css`.
4. No page may import a root Hub stylesheet directly.
5. Breakpoints are limited to 480/768/1024/1280 px in new foundation code.
6. A legacy stylesheet is deleted only after all consumers have migrated and visual, functional and accessibility QA pass.

`base.css` only affects elements carrying `data-sw-ui`; legacy Hub pages do not carry that marker, so importing it cannot alter their layout or typography.

## 4. Primitive API

New code imports from `@/components/hub/ui`:

| Primitive | API | Accessibility contract |
|---|---|---|
| `Button` | `variant`, `size`, `block`, native button props | Defaults to `type="button"`, visible focus, disabled state |
| `ActionLink` | `variant`, `size`, `block`, Next `Link` props | Preserves real anchors and keyboard navigation |
| `Card` | `variant`, `padding`, native article props | Semantic surface with no interactive behavior |
| `PageHeader` | `eyebrow`, `title`, `description`, `action`, `titleId` | Renders exactly one `h1` |
| `Metrics` / `Metric` | `label`, `value`, `description`, `icon` | Section group gets `aria-label`; icons are decorative |
| `StatusBadge` | `tone`, `icon`, children | Text is always present; icon is `aria-hidden` |
| `EmptyState` | `title`, `description`, `action`, `icon` | Uses `h2` under the page heading |
| `Tabs` | `label`, `tabs`, `activeKey`, `trailing` | Real links, `aria-current="page"`, horizontal scroll at narrow widths |

Supporting files: `Button.module.css`, `Card.module.css`, `PageHeader.module.css`, `Metrics.module.css`, `StatusBadge.module.css`, `EmptyState.module.css`, `Tabs.module.css`, and `index.ts`.

## 5. Compatibility report

UI-01 does not migrate pages. The current rendering contract remains:

- `components/hub/workspace.tsx` keeps all 29 existing exports and their DOM/class output. Only its header comment changed.
- `WorkspacePage`, `PageHeader`, `Metrics`, `Metric`, `Panel`, `ActionLink`, `SectionHeader`, `RecordList`, `RecordRow`, `StatusBadge`, `InfoChip`, `EmptyState`, `BoardCard`, `ExpandableCard`, `ListCard*`, `Card*`, `HubForm*` continue to render exactly as before.
- `components/hub/WorkspaceTabs.tsx` is unchanged: `nav.sw-filter-tabs`, real links, `is-active` and `aria-current`.
- No production `page.tsx` imports `@/components/hub/ui` yet.
- No legacy stylesheet import was added, removed or reordered relative to the other legacy imports. `tokens.css` and `base.css` are imported before the legacy set.
- `app/hub/(dashboard)/layout.tsx`, auth files, Server Actions and API routes are untouched.

Safe cleanup removed three zero-consumer files after a repository-wide scan:

- `components/hub/overview-chart.tsx`
- `app/hub/(dashboard)/SignOutButton.tsx`
- `app/hub/(dashboard)/settings/page.bkp.tsx`

The four unimported legacy stylesheets remain in place. Removing classes based only on static analysis is unsafe because some class names are assembled dynamically.

## 6. Tests and contracts

### Contract

`scripts/check-hub-ui-contract.mjs` guards:

- required token/base/primitive files;
- canonical token names;
- CSS Module scoping and token usage;
- no `!important`, sub-12 px text, versioned names or unapproved breakpoints;
- required compatibility exports and `WorkspaceTabs` markers;
- the 29 legacy stylesheet imports;
- no new legacy global page CSS.

`test/hub-ui-contract.test.ts` adds static contract tests and WCAG contrast checks for the foundation palette.

### Visual

`scripts/check-hub-visual.mjs` captures deterministic full-page screenshots at 320, 390, 768, 1024 and 1440 px for:

- `/hub-ui-fixture` — the existing workspace fixture;
- `/hub-ui-foundation` — the new test-only primitive fixture;
- `/hub/login` — the auth entry.

The script blocks external requests, disables animation and transitions, hides the caret, waits for bundled fonts, uses a fixed timezone/locale/device scale and compares PNGs against `test/visual/hub/`.

UI-01 result on the Playwright 1.62.1 Linux image: **15/15 foundation baselines, 0 pixels differ** at 320, 390, 768, 1024 and 1440 px. Baselines cover the unchanged legacy fixture, the new foundation fixture and login. UI-PREVIEW-001 adds six authenticated preview routes at the same five widths, for 45 total baselines.

The preview visual run requires `AUTH_SECRET` to match the running server; see [`hub-design-preview.md`](./hub-design-preview.md).

Refresh baselines only on the same Playwright Linux image used by CI:

```bash
npm run build
npm run start
HUB_VISUAL_UPDATE=1 npm run check:hub-visual
```

### Accessibility and responsive

`scripts/check-hub-ui-browser.mjs` checks all five widths for:

- one `h1`;
- one `aria-current="page"` tab;
- no horizontal page overflow;
- visible keyboard focus;
- no serious or critical axe violations under WCAG 2.1 AA.

## 7. Page-template map for later PRs

| Template | Routes |
|---|---|
| Dashboard | `/hub`, `/hub/billing` |
| Collection | Prospects, Opportunities, Leads, Contacts, Clients, Projects, Offers, Sent, Support, Updates, SaaS sites/plans/subscriptions |
| Detail | Clients, Contacts, Leads, Projects, Offers, Support, SaaS subscriptions, Sent, Message, Thread, Updates |
| Form | Clients/New, Projects/New, Offers/New, Offers/Send, Contacts/Edit/Delete, Support/New, Compose, Updates/New, Profile, Settings |
| Conversation | Inbox, Sent, Thread, Message, Compose |
| Settings | Settings, Profile, Profile/Notifications, MFA after #109 merges |
| Workspace | Opportunities, SaaS overview/discovery/provisioning/reconciliation, Updates |
| Alias | `/hub/billing/subscriptions`, `/hub/billing/subscriptions/[id]` |

## 8. Migration roadmap

| PR | Scope | Legacy removal after parity |
|---|---|---|
| **UI-01** | Tokens, base, primitives, contracts, visual/a11y foundation | Three dead components only; no imported CSS removed |
| **UI-02** | `HubShell`, `SidebarNav`, `Topbar`, `MobileNav`, data-driven navigation, login shell primitives | `HubNav`, `HubSidebar`, `HubWorkspaceHeader`; `workspace.css`, `workspace-shell-v3.css`, `hub-chrome.css`; shell sections of `hub.css` |
| **UI-03** | `DashboardTemplate` and `/hub` | Overview selectors in `theme.css`/`hub.css`; duplicate chart |
| **UI-04** | `CollectionTemplate`, `FilterBar`, `DataTable`/`DataList`, pagination contract | `prospects.css`, `opportunities.css`, `crm-workspace-v7.css`, leads/contacts/clients list CSS |
| **UI-05** | `DetailTemplate`, `FormTemplate`, shared fields | Client/contact/project/offer detail and form CSS |
| **UI-06** | `ConversationTemplate`, `SettingsTemplate` | Mail/thread/settings/profile/notification CSS; preserve MFA page from #109 |
| **UI-07** | SaaS, billing, support, updates and final cleanup | Remaining legacy CSS; `app/hub/layout.tsx` imports tokens/base only |

Each PR must preserve auth, MFA, Prisma, email, Stripe and Server Action contracts. Pages migrate one template at a time; no mass CSS deletion.

## 9. Security PR integration

UI-01 is based on `origin/dev` at `4b3e172` and is intentionally independent of the open security PRs.

| PR | Overlap | Resolution when merging |
|---|---|---|
| #105 Next 16.4.6 | `package.json`, lockfile | Rebase UI-01 after #105 if the package diff conflicts; keep the UI-01 scripts, regenerate the lockfile only through the dependency PR |
| #106 auth/API hardening | CI workflow, auth files | Union CI steps; do not touch auth files here |
| #107 HTTP/domain | CI workflow, `package.json`, security scripts | Keep both security and UI checks in the CI job |
| #108 database boundary | CI workflow, `package.json`, `lib/prisma.ts` | No UI code imports `lib`; no conflict expected |
| #109 MFA | CI workflow, `hub.css`, login/profile pages | Rebase after #109, preserve MFA routes and login behavior, regenerate login visual baselines because #109 changes login contrast |

Recommended merge order: #105 and #106, retarget #109, then #107/#108, then UI-01. Rebase and rerun the full browser/visual suite after any security PR that changes Hub CSS, login markup or the CI workflow.

## 10. Exact changed files

Added:

- `app/hub/styles/tokens.css`
- `app/hub/styles/base.css`
- `components/hub/ui/` — `Button`, `Card`, `PageHeader`, `Metrics`, `StatusBadge`, `EmptyState`, `Tabs`, their seven CSS Modules, `class-names.ts`, `index.ts`
- `scripts/check-hub-ui-contract.mjs`
- `scripts/check-hub-ui-browser.mjs`
- `scripts/check-hub-visual.mjs`
- `test/hub-ui-contract.test.ts`
- `test/fixtures/hub-ui-foundation-page.tsx`
- `test/visual/hub/` — 15 PNG baselines (three routes × five viewports)
- `docs/hub-design-system-2.md`

Modified:

- `app/hub/layout.tsx` — imports tokens and base before the unchanged legacy set
- `components/hub/workspace.tsx` — header comment only; all 29 exports unchanged
- `scripts/create-hub-ui-fixture.mjs` — also creates the test-only foundation route
- `package.json` — four contract/visual/browser scripts
- `.github/workflows/security-seo-check.yml` — contract, unit, a11y and visual checks
- `.gitignore` — test-only foundation route and visual output
- `docs/hub-design-system.md` — pointer to this document

Removed after zero-consumer proof:

- `components/hub/overview-chart.tsx`
- `app/hub/(dashboard)/SignOutButton.tsx`
- `app/hub/(dashboard)/settings/page.bkp.tsx`

## 11. Rollback

UI-01 is a single PR revert:

1. Revert the merge commit on `dev`.
2. Remove `tokens.css`/`base.css` imports from `app/hub/layout.tsx`.
3. Remove `components/hub/ui`, the contract/visual scripts, fixture and docs.
4. No database, auth, email, Stripe, Prisma or Server Action state needs reversal.
5. No production deployment is part of this PR.

The visual baselines are test artifacts only and have no runtime effect.

## 12. Acceptance criteria

- Typecheck, lint, production build, security tests and existing Hub browser checks pass.
- UI contract tests pass.
- Visual baselines match at all five widths.
- Foundation accessibility/responsive checks pass.
- No production page route or dashboard layout changes.
- No auth, MFA, database, Prisma, email or Stripe changes.
- No legacy imported stylesheet deleted or restyled.
- No new styling framework or runtime dependency.
- PR remains unmerged and undeployed until review and staging QA.
