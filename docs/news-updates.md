# News & Updates

Hub admins create drafts at `/hub/updates/new`, edit at `/hub/updates/:id`, and publish from the list after confirmation. Filters cover publication status, update type and title/summary search. The editor offers Markdown formatting, Write/Preview/Split views, inline images, a cover, optional CTA and pinning. Saving an already published item changes the live item immediately; the editor states this explicitly.

## Compatibility and security

- Existing announcements default to `bodyFormat=plain`. Markdown is opt-in for old content. New drafts default to Markdown with GFM tables/lists.
- The signed runtime feed retains subscription/site binding and plan targeting. It adds optional presentation fields and sorts pinned items first. Older runtimes ignore these fields; the updated runtime defaults missing fields safely.
- Both renderers skip raw HTML and reject script/data/protocol-relative URLs and URL credentials. External links use `noopener noreferrer`. Images never go through a server-side URL fetch; browsers request external images without sending a referrer.
- Hub mutations require an admin session and a matching configured public origin. Body limits are enforced on the actual byte stream. Edits use an `updatedAt` compare-and-swap transaction to prevent overwriting another session.
- Image uploads are limited to 5 MB and 25 million decoded pixels, then stripped of metadata, resized to at most 1920 × 1920 and converted to static WebP. SVG is rejected. PostgreSQL stores the assets, so they survive application redeploys without a separate upload volume.
- Asset URLs are publicly readable opaque identifiers, including uploads attached to drafts. Do not upload confidential files. Deleted drafts/announcements do not currently remove assets; retain them to avoid breaking reused image URLs. Database backups must include this table.

## Release order

1. Back up the Hub database. Set `APP_URL` to its real public origin (for example `https://staarkinc.com`). It controls both mutation origin checks and tenant-facing image URLs; do not use a private internal service URL here.
2. Run `npx prisma migrate deploy` with the production `DATABASE_URL` before serving the new Hub code, then regenerate Prisma/build through the existing deployment workflow.
3. Deploy `staark-inc/web`, then `staark-inc/nextjs`. No tenant database migration is needed. Legacy feed entries continue to render as plain text.
4. Use a staging admin to create a draft with a heading/list/table, upload an inline image and a cover, set a tenant-relative CTA, target a plan, and pin it. Confirm drafts are absent from the signed feed, then publish and verify the correct tenant sees the content and another plan does not.
5. Open the same item in two sessions; save one and confirm the second gets a conflict with its local text preserved. Test unpublish/delete confirmations and mobile editor/header layouts.

## Local checks

Use Node 22.18+ or Node 24 for the native TypeScript test runner.

```sh
npm ci
npm run test:news
npx next typegen
npm run typecheck
npm run build
```

Prisma generation/build requires a `DATABASE_URL`; local policy/image tests do not require a running database. The coordinated tenant PR runs its existing workspace typecheck, tests and build.

## Next batches

| Priority | Improvement | Acceptance criteria |
| --- | --- | --- |
| P1 | Audit history and revisions | Record editor/publisher and changes; restore a previous version; published items can have a separate draft. |
| P1 | Asset management | List storage use, identify unreferenced assets and delete only after a retention period with reuse checks. |
| P2 | Scheduling and expiry | Store dates in UTC; scheduled items cannot appear early; expired notices leave the active feed. |
| P2 | Unread indicators | Tenant/user scoped read state and a count in admin navigation, with an accessible badge. |
| P2 | Feed pagination | Database-backed filtering/pagination and bounded response sizes as the archive grows. |
| P3 | Publication analytics | Aggregate views/CTA clicks without storing unnecessary personal information. |
