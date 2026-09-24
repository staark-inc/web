# Staark Inc.

Staark Inc. is the main web platform for the Staark Inc. agency. The repository contains both the public Swedish marketing website and the internal **Staark Hub** used to manage sales, clients, offers, projects, support, and connected WordPress sites.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma 7
- PostgreSQL
- Nodemailer / SMTP
- Docker

## Platform overview

### Public website

The public site is focused on web design, development, SEO, hosting, support, local landing pages, projects, pricing, and lead generation for businesses in Sweden.

### Staark Hub

The internal Hub covers the operational workflow behind the agency:

- Inbox and email conversations
- Contacts and clients
- Prospects and prospect imports
- Ranked sales opportunities
- Leads and outreach workflow
- Offers and reusable offer templates
- Projects and project management
- Billing and support
- WordPress site connections
- WordPress support ticket sync, status updates, and replies
- Internal notifications and settings

The primary sales workflow is:

```text
Prospects → Opportunities → Leads → Offers → Clients
```

## Requirements

- Node.js 22 or newer
- npm
- PostgreSQL

## Local development

Install dependencies:

```bash
npm ci
```

Configure a local database in `.env.local`, then generate the Prisma client and apply migrations:

```bash
DOTENV_CONFIG_PATH=.env.local npx prisma generate
DOTENV_CONFIG_PATH=.env.local npx prisma migrate deploy
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation before release

Run the same checks used before promoting `dev` to production:

```bash
DOTENV_CONFIG_PATH=.env.local npx prisma generate
DOTENV_CONFIG_PATH=.env.local npx prisma migrate status
rm -rf .next
npm run build
```

Useful npm commands:

```bash
npm run dev      # Start local development
npm run lint     # Run ESLint
npm run build    # Create a production build
npm run start    # Start the production server
```

## Environment configuration

At minimum, the application expects a PostgreSQL `DATABASE_URL`. Some features also require additional integration-specific environment variables.

Example SMTP configuration:

```dotenv
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=
```

Database environments should remain separate between development and production.

Typical setup:

```text
Development: staark_dev
Production:  staark
Shadow DB:   staark_hub_shadow
```

Do not commit credentials, connector secrets, certificates, or production environment files.

## WordPress connector

Staark-managed WordPress installations can connect to the Hub using the Staark WordPress connector.

The connector supports:

- Site pairing
- Signed connection checks
- Site/environment sync
- Support ticket intake
- Support status synchronization
- Staark replies delivered back to the WordPress support ticket

Connector requests are authenticated using a per-site secret and signed HMAC requests.

## Production deployment

The project includes a multi-stage `Dockerfile` that generates Prisma during the image build, creates the Next.js standalone output, and runs the production application as the non-root `node` user.

For the repository's Docker/Traefik deployment, use:

```text
compose.staarkinc.yml
```

Production database migrations should be checked and applied before or during deployment:

```bash
DOTENV_CONFIG_PATH=.env npx prisma migrate status
DOTENV_CONFIG_PATH=.env npx prisma migrate deploy
```

## Git workflow

Development work follows this flow:

```text
feature/* or fix/*
        ↓
       dev
        ↓
 build + smoke test
        ↓
      main
        ↓
 production deploy
```

`main` is the production branch. Feature work should not be developed directly on `main`.

## Project structure

```text
app/                  Next.js routes, Hub UI, public pages and API handlers
app/hub/              Staark Hub styles and layout
app/api/hub/          Hub APIs and integrations
lib/                  Shared application and integration logic
prisma/               Prisma schema and migrations
public/               Static assets
Dockerfile            Production container image
compose.staarkinc.yml Production Docker Compose service
```

## Release state

The current production release includes the completed sales workflow, offer flow, WordPress connector, and support sync/reply workflow.

After release, product changes should stay focused on real bugs, proven operational needs, or work that directly improves sales and client delivery.
