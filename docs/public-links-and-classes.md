# Public website links and semantic CSS classes

This PR is stacked on the public website security/SEO PR so its diff contains only link copy, navigation, CSS naming and their verification.

- Replace versioned public design classes and variables with stable `site-*` / `--site-*` names across JSX, CSS and browser selectors. Existing `/figma-v2/` asset URLs remain valid. Hub code is outside this public website change.
- Replace generic standalone card link text with visible destination-specific text on homepage, service lists, local pages, projects and blog articles.
- Add Blogg to the shared desktop/mobile navigation and legacy public header. Match menu focus behavior to the CSS 1100px mobile breakpoint and keep desktop navigation in the header flex layout to accommodate the extra link.
- Blog and published articles were already in the sitemap with canonical URLs and indexable metadata. Navigation strengthens internal discovery; actual Google index status requires Search Console and cannot be inferred from source code.
- Production HTTP checks inspect each sitemap page for versioned classes, empty or generic links and missing blog navigation, and resolve all discovered public internal links. Browser checks verify desktop navigation bounds and horizontal overflow at mobile/tablet/desktop sizes.

Run the existing unit suites, production build/typecheck, HTTP smoke checks and browser checks. Contact/checkout browser requests remain mocked.
