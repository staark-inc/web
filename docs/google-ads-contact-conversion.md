# Google Ads: Contact conversion

The public site uses one consent-controlled Google tag for the existing Analytics
property and Google Ads account `AW-18468720832`. The Contact conversion destination
is `AW-18468720832/dUsbCJ3tlIIdEMChyeZE`. These are public tag identifiers, not secrets;
no new environment variables or database migrations are required.

## Behavior

- Statistics and marketing are separate, initially disabled choices. Old v1
  statistics consent is not promoted to marketing consent; visitors see the new
  banner once and save a v2 preference.
- Basic consent mode: no Google library is requested before an allowed choice.
  Statistics configures GA only; marketing configures Ads only; both share one
  loader. Existing automatic GA page-view behavior is preserved.
- Advertising personalization stays denied. The site does not send form names,
  email addresses or messages to Google, and does not implement enhanced conversions.
- Contact submission reports the existing GA `generate_lead` event if statistics
  is allowed, and the Ads `conversion` event if marketing is allowed. Each has an
  explicit destination so GA events are not broadcast to Ads.
- Reporting requires HTTP success and `ok: true`. `/api/contact` returns an opaque
  UUID only after the email and CRM work succeeds. Honeypot responses omit the UUID.
  The UUID is also the Ads `transaction_id`; repeated handling is deduplicated in
  the current document. No fixed revenue value is invented.
- Viewing `/kontakt`, clicking Submit, a pending request, errors, honeypot responses,
  and reloading the contact page do not report a conversion.
- Tags are not initialized on `/hub`, `/offert`, `/saas/setup` or `/saas/checkout`.
  Entering those routes after loading a tag triggers a full reload. As with the
  previous GA integration, remotely configured enhanced-measurement behavior
  must be checked in Tag Assistant when navigating from public to private pages.
- Withdrawal updates Google's consent, clears accessible first-party `_ga*` or
  `_gcl_*` cookies, and reloads if a configured destination lost consent. A loaded
  script cannot be unloaded simply by removing its DOM element. Cross-tab changes
  are observed too. If storage is blocked, the choice works for the current page.

## Deployment and Google Ads verification

1. Merge the PR and deploy the rebuilt application through the existing pipeline.
   No Google Ads account settings are changed by this PR.
2. In Google Ads, verify the Contact action matches the ID and label above. For
   lead generation, use the **One** counting option. If the same `generate_lead`
   event is also imported from GA4, keep only one of these equivalent actions
   primary for bidding to avoid counting the same enquiry twice.
3. Use Tag Assistant with the deployed site. Before consent, there should be no
   Google tag request. Statistics alone should not configure `AW-18468720832`.
   Allow marketing, then send one deliberate test enquiry; confirm exactly one
   Contact event, the correct `send_to`, and its opaque transaction ID. This live
   test creates a real CRM enquiry/email and may record a conversion.
4. Check rejection and withdrawal, and inspect CSP warnings. The allowlist includes
   Google's documented Ads endpoints and `.com`/`.se` regional endpoints. If a
   visitor's region uses another Google TLD, add that exact required origin rather
   than broadly allowing scripts or connections from any HTTPS host.
5. Check the conversion diagnostics in Google Ads. A successful local test does
   not prove receipt by Google or attribution to a paid click. Diagnostics and
   reporting can lag behind deployment; ad blockers can also prevent measurement.

## Local verification

- `npm run test:google-ads` checks consent, destinations, queue shape, duplicate
  handling, private paths, revocation, storage failures and tracking exceptions.
- `npm run check:google-ads-browser` against a running local production build
  checks all four consent combinations plus pending/error/honeypot/success
  responses, repeated receipts, page reloads and revocation. It intercepts all
  external requests and `/api/contact`; no Google events or emails are sent.
- `npm run test:security-seo`, `npm run test:public-website`, `npm run typecheck`,
  and `npm run build` verify the surrounding application.

References:
- https://developers.google.com/tag-platform/devguides/conversions
- https://developers.google.com/tag-platform/security/guides/consent?consentmode=basic
- https://developers.google.com/tag-platform/security/guides/csp
- https://support.google.com/google-ads/answer/10632359
