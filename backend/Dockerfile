# ---- Build stage ----
FROM node:20-slim AS builder

WORKDIR /app
# Chromium comes from the OS package in the runtime image; skip Puppeteer's bundled download.
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/
RUN npm ci

COPY src ./src
RUN npm run build

# ---- Runtime stage ----
FROM node:20-slim AS runner

# Chromium for the GeM headless scraper, OpenSSL for the Prisma engine.
RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium openssl ca-certificates fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER node
EXPOSE 5000

# Applies the Prisma schema to the database, then starts the API.
CMD ["npm", "run", "start:prod"]
