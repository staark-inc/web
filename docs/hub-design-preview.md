# Staark Hub Design Preview V1

> V2 redesign: see [`hub-design-preview-v2.md`](./hub-design-preview-v2.md). The V1 preview screenshots are retained as the before state.

Status: **UI-PREVIEW-001 implemented and pending review.** Stacked on `fix/staark-hub-ui-01-foundation`; retarget to `dev` after UI-01 merges.

## 1. Purpose

`/hub/design-preview` is an isolated, interactive visual approval surface for Design System 2.0. It demonstrates the proposed language before any production Hub page is migrated.

It is deliberately separate from `/hub` navigation and the production dashboard layout:

- admin-only server guard in `app/hub/(preview)/design-preview/layout.tsx`;
- `robots: noindex, nofollow, nocache` plus the existing `/hub/:path*` noindex header;
- no link from `HubNav`, `HubSidebar` or the dashboard layout;
- no production page imports the preview components;
- no Prisma query, API call, Server Action, Stripe call, email call or external request;
- all client interactions mutate local React state only.

The route inherits `app/hub/layout.tsx`, which still imports the legacy stylesheets. The preview markup itself uses only UI-01 tokens, primitives and its own CSS Module. Legacy CSS is not used by any preview selector.

## 2. Preview sections

| Section | Demonstrates | Interactions |
|---|---|---|
| Dashboard | Metrics, trend chart, range controls, activity, attention list, source mix, insight card | Range switch, priority navigation, collection navigation |
| CRM collection | Summary metrics, search, owner filter, status filters, table, mobile cards, pagination, empty state | Search, filters, pagination, record navigation |
| CRM detail | Entity header, status/tags, action priority, stats, tabs, timeline, contact, next step and tags panels | Tabs with arrow keys, local add-note dialog, file/action notices |
| Forms | Inputs, select, textarea, hint/error wiring, disabled action, dialog and success status | Validation, confirm dialog, save, reset |
| Settings | Settings nav, workspace values, integration cards, statuses, notification toggles | Settings tabs, integration state, switches |
| Global shell | Sidebar, compact rail, topbar, breadcrumb, mobile drawer, notification modal and focus behavior | Open mobile navigation, open notifications, mark all read, Escape/focus return |

The shell wraps every section. At desktop the navy sidebar is 260 px; at 769–1024 px it becomes a 76 px icon rail; at 768 px and below navigation moves into a native modal drawer.

## 3. Safety model

- Every client file is local-state only.
- No `use server`, `fetch`, Prisma, Stripe, email, WordPress or SaaS runtime calls.
- Mock names, emails and amounts are fictional; emails use the reserved `.example` domain.
- The route is server-guarded with `getSession()` and an ADMIN role check.
- The preview has no production navigation entry.
- No production page or dashboard layout was modified.
- No database migration, schema change, auth change or deployment is included.

## 4. Visual contract

- Navy sidebar `--sw-sidebar-bg`, light canvas `--sw-bg`, white surfaces.
- Restrained blue accent `--sw-accent`; status colors use the canonical success/info/warning/danger tokens.
- Operational text is at least 12 px; chart labels are HTML text rather than scaled SVG text.
- Focus uses the UI-01 2 px accent outline and ring token.
- Spacing, radius, shadow and typography values come from `tokens.css`.
- Status is never communicated by color alone; badges include text.
- Controls use native buttons, links, inputs, selects, textareas and dialogs.
- Mobile table data is repeated as semantic cards; the table is hidden below 768 px.

## 5. Responsive coverage

| Width | Shell | Content |
|---|---|---|
| 320 | Topbar + modal drawer, no avatar | One-column metrics, stacked cards, public cards, scrollable filters |
| 390 | Topbar + modal drawer | Same as 320 with comfortable margins |
| 768 | Topbar + modal drawer | Stacked forms/detail, mobile collection cards |
| 1024 | 76 px icon rail | Single-column dashboard/detail/settings, two-column integration grid |
| 1440 | 260 px sidebar | Full dashboard/detail/settings density |

## 6. Tests

### Browser and accessibility

`scripts/check-hub-preview.mjs` verifies:

- unauthenticated visitors redirect to `/hub/login`;
- HTTP `X-Robots-Tag` and document robots both contain `noindex`;
- all six sections at 320, 390, 768, 1024 and 1440;
- one visible current navigation item (or breadcrumb at mobile);
- no horizontal page overflow;
- no external requests or page errors;
- axe WCAG 2.1 AA with no violations;
- collection search/filter behavior;
- form validation, confirmation dialog and success status;
- settings integration state and switches;
- notification mark-all-read and indicator update;
- mobile drawer navigation and focus restoration.

### Visual regression

`scripts/check-hub-visual.mjs` now includes six preview routes at five widths in addition to the UI-01 fixture/login baselines. The committed set is:

`test/visual/hub/preview-{dashboard,collection,detail,forms,settings,shell}-{320x568,390x844,768x900,1024x768,1440x900}.png`

The screenshots are deterministic: bundled fonts, fixed timezone/locale/device scale, blocked external requests, disabled animation/transitions and the Playwright 1.62.1 Linux image.

### Static contract

`test/hub-preview.test.ts` verifies auth/noindex markup, no business imports, no production navigation link, local-state CSS-module rules, section inventory and baseline coverage.

## 7. Running locally

The preview session uses the real auth guard. Start the server with a test-only secret and use the same secret for the browser scripts:

```bash
export AUTH_SECRET="local-preview-only-secret"
export DATABASE_URL="postgresql://staark:build-only@localhost:5432/staark"
npm run build
npm run start
npm run check:hub-preview
npm run check:hub-visual
```

The browser scripts sign a test-only ADMIN session cookie. No production account or customer record is involved.

Refresh visual baselines only inside the Playwright Linux image used by CI:

```bash
HUB_VISUAL_UPDATE=1 npm run check:hub-visual
```

## 8. Approval points before UI-02

UI-02 must not start until reviewers explicitly accept:

1. **Visual language**: navy sidebar, light surfaces, restrained blue, typography scale, radii and shadows.
2. **Information density**: dashboard, collection table and detail density at 1024 and 1440.
3. **Shell behavior**: 260/76/mobile modes, topbar, breadcrumb, notification indicator and focus restoration.
4. **Collection contract**: search/filters, status tabs, table-to-card switch, pagination and empty state.
5. **Detail contract**: header hierarchy, status/actions, tabs, timeline and side-panel order.
6. **Form contract**: label/hint/error wiring, confirmation dialog and success feedback.
7. **Settings contract**: settings navigation, integration status language and switches.
8. **Accessibility**: no serious/critical axe findings, keyboard navigation and WCAG AA contrast.
9. **Responsive parity**: all five widths approved with screenshots.
10. **Safety**: no production queries, mutations, PII, navigation entry or legacy selector usage.

## 9. Integration and rollback

- The preview branch is stacked on UI-01. Rebase after UI-01 and any auth/security PRs before opening the `dev` PR.
- If #109 changes login/profile styles, refresh only the login visual baseline affected by that merge.
- The preview route does not modify auth, MFA, Prisma, email, Stripe or Server Actions, so a revert is a single PR revert.
- Roll back by removing `app/hub/(preview)/design-preview`, the preview scripts/tests and the `preview-*` baselines, and restoring the previous CI env/steps. No data or schema reversal is required.
