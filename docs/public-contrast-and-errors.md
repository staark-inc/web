# Public contrast and error pages

The supplied PageSpeed desktop report flagged 19 homepage nodes: small white text on #3b82f6 and blue labels/links on white or #f8fafc. Their measured ratios were 3.67:1 and 3.51:1, below 4.5:1.

Use #1d4ed8 for the shared public blue token. Darken muted form placeholders, privacy notes and crossed-out SaaS prices where their previous gray was too light. Keep decorative background tints separate from text colors.

Add Swedish branded app/not-found.tsx (404, noindex), app/error.tsx (application error boundary with retry), and app/global-error.tsx (root layout error fallback with its own html/body and CSS). Public messages never display exception details. The root fallback also applies if an error escapes a nested application boundary.

Playwright uses axe-core color-contrast checks on the initial consent dialog, all sitemap pages, legal pages and a missing-page response. It verifies 404 status and recovery links. GitHub Actions creates an uncommitted CI-only failing route before building to exercise the 500 error UI, retry and recovery; the fixture is not shipped in this repository. Root-layout failures require manual fault injection in a staging build to validate the global error boundary independently.

A fresh PageSpeed run after deployment is needed to measure the resulting live score; no score is guaranteed by a source change.
