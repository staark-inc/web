FROM node:22-bookworm-slim AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://staark:build-only@localhost:5432/staark"

# Prisma/PostgreSQL runtime dependency
RUN apt-get update -y \
    && apt-get install -y openssl \
    && rm -rf /var/lib/apt/lists/*

# Package files
COPY package.json package-lock.json ./

# Prisma must exist before npm ci because postinstall runs prisma generate
COPY prisma ./prisma
COPY prisma.config.ts ./

# Install dependencies + generate Prisma Client
RUN npm ci

# Copy the rest of the application
COPY . .

# Build Next.js
RUN npm run build


FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Prisma PostgreSQL adapter needs OpenSSL at runtime too
RUN apt-get update -y \
    && apt-get install -y openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

USER node

EXPOSE 3000

CMD ["node", "server.js"]