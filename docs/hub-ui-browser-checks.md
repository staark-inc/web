# Hub UI browser checks

The notification dialog and mobile navigation use the production components. Project and notification-preference layouts use representative markup and synthetic data, without authentication or database overrides. All notification API responses are mocked, including failed requests. These checks do not send email or change real Hub data.

## Run locally

```sh
node scripts/create-hub-ui-fixture.mjs
npm run build
npm start -- --hostname 127.0.0.1
# In another terminal:
npm run check:hub-browser
```

The fixture is generated at `app/hub-ui-fixture/page.tsx` only for these checks. It is excluded from Git and Docker contexts and is not created by the normal build. Remove that directory when finished and rebuild before running a local production preview. CI creates the fixture only in the test job; image publishing uses a separate clean checkout.

Optional environment variables:

- `SEO_CHECK_URL`: local test server origin (default `http://127.0.0.1:3000`).
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`: an existing compatible Chromium binary.
- `HUB_SCREENSHOT_DIR`: save screenshots for visual review.

Checks cover standard and compact navigation at widths of 320, 390, 768, 1024 and 1440 pixels; notification clipping, scrolling, keyboard focus and dismissal; unread filtering and counts; pending/failed saves and refresh recovery; mobile menu access; horizontal overflow; and the notification dialog's automated accessibility scan.

The page samples do not replace an authenticated smoke check of real Hub data after deployment.
