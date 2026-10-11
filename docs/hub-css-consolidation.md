# Hub CSS consolidation audit

## Baseline (dev, 2026-10-11)

`app/hub/layout.tsx` imports **43 CSS stylesheets**, of which **19** contain version or patch naming patterns (`v2`, `v3`, `v7`, `polish`, `compact`, `density`). The shared `app/hub/theme.css` is already active.

Do **not** mass-delete these stylesheets: the Hub uses global selectors and many pre-Foundation screens are still active. Import ordering also affects cascade behavior.

## Safe cleanup performed

- Removed committed backup `app/hub/workspace.css.bak-ui04`. It is not a CSS import and should live in Git history, not in the application tree.

## Candidate legacy stylesheet review

- `app/hub/inbox-workspace-v2.css` and `app/hub/inbox-workspace-polish.css` no longer have direct imports from the migrated Inbox listing, but they may still contain rules used elsewhere. Verify selector use before deleting.
- `app/hub/leads-v2-readable.css` no longer has a direct import from the migrated Leads listing, but do not assume global unused status without repository-wide inspection.
- `app/hub/overview-command-center.css`: original Overview markup was replaced, but this stylesheet may define shared selectors. Audit before removal.
- `app/hub/crm-workspace-v7.css`: still imported at layout scope; Clients, Projects, Offers and Billing may depend on it.
- `app/hub/workspace.css`, `workspace-shell-v3.css`, `hub-nav-groups-v3.css`, `dashboard-density-v3.css`, `hub-ui-04.css`: do not remove without shell/mobile regression checks.

## Consolidation policy

1. Keep only one canonical design system: `app/hub/theme.css` + reusable React components.
2. As each module is migrated, identify all selectors used by that module in legacy stylesheets and move only needed styling into the canonical theme. Prefer deleting redundant declarations over overriding them.
3. Remove a legacy stylesheet only once it has no remaining imports and no selectors needed by live views, or its whole module has been migrated.
4. Use Git history for backups. No checked-in `.bak`, `*-fix.css`, `*-polish.css`, or `*-vN.css` for new development.
5. Inspect desktop and mobile (375 / 768 / 1440 px) and run the existing TypeScript/lint/build checks between cleanup batches.
6. Preserve the Inbox/Sent/Compose/Thread interactions and CRM business flows; do not modify database, authentication or network logic as part of a CSS cleanup.

## Follow-up

Run a repository-wide static import and selector audit on the Debian checkout (e.g. with ripgrep or a parsing script) before a subsequent removal PR. Confirm imported selectors inside CSS, JSX, TSX, and any dynamic class names. Delete in small batches, with screenshots before and after.
