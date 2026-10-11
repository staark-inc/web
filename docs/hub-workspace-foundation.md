# Staark Workspace — UI Foundation

## Direction

Classic, clean CRM interface. Navy sidebar, white content surfaces, subdued slate typography and Staark blue for primary actions. Consistent spacing, readable labels, and clear keyboard focus.

## Ownership

- `app/hub/theme.css` — canonical design tokens and `sw-*` component styles.
- `components/hub/workspace.tsx` — typed, presentational workspace components.
- `app/hub/(dashboard)/page.tsx` — first page to migrate, in the next Overview PR.

No `*-v2.css`, `*-polish.css`, `*-fix.css` or one-off override layers are allowed for new UI. Keep existing legacy styles in place until the corresponding feature has been migrated and verified; remove unused legacy rules at that point rather than accumulating overrides.

## Current primitives

`WorkspacePage`, `PageHeader`, `Metrics`, `Metric`, `SectionHeader`, `RecordList`, `RecordRow`, `InfoChip`, `EmptyState`.

These deliberately do not fetch data or mutate backend state. Pages supply data and navigation URLs.

## Chart foundation (next PR: Overview)

Recommended chart library: **Recharts** with responsive SVG rendering, typed data adapters and accessible textual summaries. Add the dependency and commit both `package.json` and `package-lock.json` together when the first chart is implemented. Avoid generating charts from hard-coded sample data in production.

Chart components:
- `TrafficChart`: GA4 daily sessions and visitors, with 7/30/90-day period controls where data is available.
- `SearchChart`: Search Console daily clicks and impressions; handle mismatched data ranges.
- `SalesChart`: pipeline by status; only use existing CRM data and explicit currency formatting.
- `ChartPanel`: title, period, loading/empty/error state, legend and readable numerical fallback.

Charts must have tooltips, sensible axis ticks, mobile responsiveness and reduced-motion handling. Do not use CSS-drawn pseudo-charts.

## Migration order

1. **Foundation PR:** primitives, tokens and documentation (no visual switch).
2. **Overview PR:** install charts, import theme in the Hub layout, migrate Overview into components and test at 375 / 768 / 1024 / 1440px.
3. **CRM pages:** migrate Clients, Leads, Projects, Offers and Billing one at a time, replacing old selectors instead of adding CSS overrides.
4. **Cleanup:** delete no-longer-used legacy styles and their imports.

## Testing gates

- `npx next typegen && npx tsc --noEmit`
- `npm run lint` (existing repository warnings evaluated separately)
- `git diff --check`
- Playwright desktop/mobile screenshots, keyboard focus and navigation checks.
- Ensure current public website, API, authentication and database logic are unchanged.
