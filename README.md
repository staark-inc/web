# Staark Inc.

The Staark Inc. website is a Swedish-language marketing site for web design, hosting, SEO, and support services for local businesses. It is built with Next.js, React, TypeScript, and Tailwind CSS.

## Requirements

- Node.js 22 or newer
- npm

## Local development

Install dependencies and start the development server:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Available commands:

```bash
npm run lint    # Run ESLint
npm run build   # Create a production build
npm run start   # Start the production server
```

## Contact form configuration

The contact form sends email through an SMTP server. Add these variables to `.env.local` for local development or to the production environment:

```dotenv
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
CONTACT_TO_EMAIL=
# Optional; defaults to SMTP_USER
CONTACT_FROM_EMAIL=
```

The SMTP credentials and destination address are required when the contact form is submitted.

## Production deployment

The project includes a multi-stage `Dockerfile` that builds the Next.js standalone output and runs it as the non-root `node` user:

```bash
docker build -t staarkinc-web .
docker run --env-file .env.production -p 3000:3000 staarkinc-web
```

For the repository's Traefik setup, use `compose.staarkinc.yml`. It expects an existing external Docker network named `staark-network` and routes `staarkinc.com` and `www.staarkinc.com` to the container.

## Project structure

- `app/` — routes, layouts, API handlers, and reusable page components
- `app/api/contact/route.ts` — contact form validation and SMTP delivery
- `public/` — static images, icons, and web manifest
- `Dockerfile` — production container image
- `compose.staarkinc.yml` — production Docker Compose service
