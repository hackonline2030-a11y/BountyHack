# Aligné sur package.json > packageManager (pnpm@9.9.0).

# Development stage (Node LTS / actuel : https://hub.docker.com/_/node)
FROM node:24 AS development
ARG PNPM_VERSION=9.9.0
# Nx in Docker/CI: deep pnpm paths can exceed default socket path length; disable daemon in image builds
ENV NX_DAEMON=false
ENV NX_SOCKET_DIR=/tmp/nx
# Puppeteer in Docker: install Chromium + point Puppeteer at it (same pattern as common guides, e.g. Medium « Puppeteer in Docker »).
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROMIUM_PATH=/usr/bin/chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /usr/src/app
COPY pnpm-lock.yaml ./
RUN pnpm fetch --prod
COPY . .
RUN pnpm install
USER node

# Build stage
FROM node:24 AS build
ARG PNPM_VERSION=9.9.0
ENV NX_DAEMON=false
ENV NX_SOCKET_DIR=/tmp/nx
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /usr/src/app
COPY pnpm-lock.yaml ./
COPY --from=development /usr/src/app/node_modules ./node_modules
COPY . .
RUN pnpm exec prisma generate
RUN pnpm build
ENV NODE_ENV=production
# Prod node_modules : don’t download Puppeteer’s bundled Chrome (production uses Alpine Chromium).
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN pnpm install --prod
USER node

# Production stage
FROM node:24-alpine AS production
# Puppeteer PDF: Alpine Chromium (path is still /usr/bin/chromium)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROMIUM_PATH=/usr/bin/chromium
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/views ./views
COPY --from=build /usr/src/app/static ./static
# EJS templates and static assets for PDF rendering (`reports.frozen_content` comes from the database).
COPY --from=build /usr/src/app/templates ./templates
CMD ["node", "dist/main.js"]
