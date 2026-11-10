# Staark Hub Design Preview V2

Status: **UI-PREVIEW-002 implemented and pending approval.** Stacked on `feat/staark-hub-ui-preview-001` (#111); retarget to `dev` after UI-01 and Preview V1 merge.

## 1. Intent

V2 is a composition and identity redesign of the isolated preview, not a token-only reskin. It establishes a new Staark product generation while keeping the UI-01 foundation, auth guard, noindex policy, static data and CSS Module ownership intact.

Production pages, the production shell, auth/MFA, Prisma, email and Stripe are untouched.

## 2. Design decision log

| Decision | V1 | V2 |
|---|---|---|
| Brand/navigation | Generic navy sidebar with small brand | Midnight navigation, lime brand glyph, grouped IA, search, soon-state groups, compact toggle |
| Typography | UI sans scale | Display face for page titles, hero values and major numbers; sans for operational reading |
| Canvas | Light neutral | Cloud canvas with white operational surfaces |
| Dashboard | Four equal KPIs + large chart | Operational header, midnight pipeline hero, priority queue, compact KPI rail, secondary activity/source |
| Chart | Large primary chart | Contextual hero chart that does not own the viewport |
| Collection | Large card around toolbar and table | Toolbar on canvas, dense table surface, row actions, mobile record cards |
| Detail | Page title + separate entity card | One entity-first header with commercial strip, next action, timeline, notes and side rail |
| Forms | Single card stack | Grouped contact/commercial/notes sections, destructive confirmation, local pending state |
| Settings | Tabs + integration cards | Sticky category nav, mobile select, integration rows, notification switches, MFA/security panel |
| Global shell | Description-only | Shell anatomy, live action rail, responsive mode cards and navigation model |
| Lime | Not present | Brand mark, active nav rail, live signal and positive health only |
| Elevation/effects | Soft cards | Borders first, restrained shadow, no gradients, glass or glow |

### What did not change

- `--sw-*` remains the only token vocabulary. V2 adds `--sw-midnight`, `--sw-electric`, `--sw-cloud`, `--sw-signal`, `--sw-font-display` and `--sw-muted-on-cloud`.
- All UI-01 primitives remain the base: `Button`, `ActionLink`, `Card`, `PageHeader`, `StatusBadge`, `EmptyState`, `Metrics` where appropriate.
- PreviewDialog stays the native modal wrapper.
- No new styling framework, runtime dependency, versioned class or legacy selector.
- No production Hub route, shell, Server Action, auth or database behavior changed.

## 3. Before/after screenshots

V1 baselines are retained under `test/visual/hub/preview-*`. V2 baselines are written to `test/visual/hub/preview-v2-*`.

| Section | Desktop before | Desktop after | Mobile before | Mobile after |
|---|---|---|---|---|
| Dashboard | [V1 1440](../test/visual/hub/preview-dashboard-1440x900.png) | [V2 1440](../test/visual/hub/preview-v2-dashboard-1440x900.png) | [V1 390](../test/visual/hub/preview-dashboard-390x844.png) | [V2 390](../test/visual/hub/preview-v2-dashboard-390x844.png) |
| CRM collection | [V1 1440](../test/visual/hub/preview-collection-1440x900.png) | [V2 1440](../test/visual/hub/preview-v2-collection-1440x900.png) | [V1 390](../test/visual/hub/preview-collection-390x844.png) | [V2 390](../test/visual/hub/preview-v2-collection-390x844.png) |
| CRM detail | [V1 1440](../test/visual/hub/preview-detail-1440x900.png) | [V2 1440](../test/visual/hub/preview-v2-detail-1440x900.png) | [V1 390](../test/visual/hub/preview-detail-390x844.png) | [V2 390](../test/visual/hub/preview-v2-detail-390x844.png) |
| Forms | [V1 1440](../test/visual/hub/preview-forms-1440x900.png) | [V2 1440](../test/visual/hub/preview-v2-forms-1440x900.png) | [V1 390](../test/visual/hub/preview-forms-390x844.png) | [V2 390](../test/visual/hub/preview-v2-forms-390x844.png) |
| Settings | [V1 1440](../test/visual/hub/preview-settings-1440x900.png) | [V2 1440](../test/visual/hub/preview-v2-settings-1440x900.png) | [V1 390](../test/visual/hub/preview-settings-390x844.png) | [V2 390](../test/visual/hub/preview-v2-settings-390x844.png) |
| Global shell | [V1 1440](../test/visual/hub/preview-shell-1440x900.png) | [V2 1440](../test/visual/hub/preview-v2-shell-1440x900.png) | [V1 390](../test/visual/hub/preview-shell-390x844.png) | [V2 390](../test/visual/hub/preview-v2-shell-390x844.png) |

All five widths are covered for every section in the committed V2 set.

## 4. Component reuse report

| Primitive | Reused in |
|---|---|
| `Button` | Header actions, chart ranges, table actions, dialogs, shell rail |
| `ActionLink` | Dashboard, login/mail actions and detail header |
| `Card` | KPI rail, activity, source, collection table, detail panels, forms, settings, shell |
| `PageHeader` | Dashboard, collection, forms, settings, global shell |
| `StatusBadge` | Client status, notices, integration state, preview state |
| `EmptyState` | Filtered-empty collection |
| `PreviewDialog` | Search, quick create, notifications, mobile nav, add note, save and discard confirmation |
| CSS Modules | All V2 visual rules remain scoped to the preview route |

No new shared primitive was added in this PR. If UI-05/UI-07 need the same field, signal or timeline treatment, promote it from the preview module after the page migration begins.

## 5. Interaction coverage

- Pipeline range switch: 7d / 30d / 90d.
- Global search: sidebar trigger, mobile trigger, Ctrl/⌘ K, local result navigation.
- Quick create dialog: local navigation into forms/detail.
- Compact navigation toggle with accessible name and icon rail.
- CRM search, owner filter, status segmentation and pagination.
- Detail tabs with arrow-key navigation, add-note dialog and local timeline update.
- Form validation, save confirmation, simulated pending state, success status and discard confirmation.
- Settings category tabs, mobile category select, integration update, notification switches and MFA/security view.
- Notification dialog with local mark-all-read and indicator update.
- Mobile navigation drawer with focus containment, Escape close and focus restoration.

## 6. Accessibility and responsive results

- Axe WCAG 2.1 AA: **0 violations** for all six sections at 320, 390, 768, 1024 and 1440 px.
- Axe: **0 violations** in search, quick create, mobile navigation, notification, form and discard dialogs.
- One logical `h1` per section; detail uses its entity header as the only `h1`.
- Minimum operational text remains 12 px.
- `--sw-muted-on-cloud` was added because the cloud canvas needed a darker secondary text value to stay above 4.5:1.
- Focus uses the canonical 2 px accent outline; dialogs use native `<dialog>` semantics.
- No horizontal overflow at any tested width.
- Compact rail and mobile drawer retain accessible names.
- Reduced-motion media query disables non-essential transitions.

## 7. Testing

Required commands:

```bash
npm run typecheck
npm run lint
npm run build
npm run test:hub-ui
npm run test:hub-preview
npm run check:hub-preview
npm run check:hub-visual
npm run check:hub-browser
npm run test:security-seo
```

Visual baselines are generated only in the Playwright 1.62.1 Linux image. V1 baselines are retained as the before state; V2 baselines are only refreshed after the design decision log is updated.

## 8. Staging integration

1. Merge/rebase UI-01 (#110) and Preview V1 (#111) into the integration baseline.
2. Rebase this branch; retarget the PR to `dev`.
3. Ensure the staging container has the existing `AUTH_SECRET` and `DATABASE_URL`; no new migration or env variable is required.
4. Deploy the branch to the isolated staging container. `/hub/design-preview` remains admin-only and noindex.
5. Sign in as an isolated staging administrator. Do not use production customer data.
6. Run `check:hub-preview` and `check:hub-visual` against the staging origin, or repeat the authenticated interaction checklist manually.
7. Confirm the production Hub navigation still has no preview link.
8. Record approval against the checklist below.

## 9. Rollback

Revert this PR only. It changes the preview route, its CSS module, preview tests and V2 baselines. No database migration, schema, auth flow, Server Action, email or Stripe state is involved. V1 preview remains available from the previous PR/baseline set.

## 10. UI-02 approval checklist

- [ ] V2 visual language and typography approved.
- [ ] Navigation hierarchy and compact/mobile behavior approved.
- [ ] Dashboard first-viewport density approved at 1440 and 1024.
- [ ] Collection table/card contract approved at 1440 and 390.
- [ ] Detail entity header, next action and side rail approved.
- [ ] Forms validation/discard/save states approved.
- [ ] Settings categories, integrations, notifications and MFA presentation approved.
- [ ] Desktop/tablet/mobile screenshots accepted.
- [ ] Axe and keyboard results accepted.
- [ ] No production route, auth, database, email or Stripe change accepted.
- [ ] Explicit approval to start UI-02 shell migration recorded.
