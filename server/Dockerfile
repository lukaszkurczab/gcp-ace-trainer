# Source tag: 22.13.1-bookworm-slim; captured 2026-08-09.
FROM docker.io/library/node@sha256:83fdfa2a4de32d7f8d79829ea259bd6a4821f8b2d123204ac467fbe3966450fc AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM docker.io/library/node@sha256:83fdfa2a4de32d7f8d79829ea259bd6a4821f8b2d123204ac467fbe3966450fc AS runtime

ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

USER node
EXPOSE 8080

# Cloud Run performs the network readiness check. This only proves that the
# Node process remains alive; it deliberately does not add an unauthenticated
# application endpoint.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD ["node", "-e", "process.kill(1, 0)"]

CMD ["node", "dist/index.js"]
