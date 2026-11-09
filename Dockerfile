FROM node:24.18.0-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM deps AS migrate
COPY prisma ./prisma
COPY prisma.config.ts ./
CMD ["npm", "run", "db:migrate:deploy"]

FROM node:24.18.0-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV LOG_ROOT=/app/logs
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/README.md ./README.md
COPY --from=build --chown=node:node /app/docs ./docs
RUN mkdir -p /app/logs && chown node:node /app/logs
USER node
EXPOSE 3000
CMD ["node", "server.js"]
