FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . ./
ARG NEXT_PUBLIC_API_URL=https://api.saitena.com
ARG NEXT_PUBLIC_CLIENT_AREA_URL=https://portal.saitena.com
ARG NEXT_PUBLIC_AUTH_ENABLED=false
ARG NEXT_PUBLIC_INDEXING_ENABLED=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_PUBLIC_CLIENT_AREA_URL=$NEXT_PUBLIC_CLIENT_AREA_URL NEXT_PUBLIC_AUTH_ENABLED=$NEXT_PUBLIC_AUTH_ENABLED NEXT_PUBLIC_INDEXING_ENABLED=$NEXT_PUBLIC_INDEXING_ENABLED NEXT_TELEMETRY_DISABLED=1
RUN npm run build
FROM node:24-alpine AS candidate
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/package*.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0"]

FROM build AS release-review
RUN test "$NEXT_PUBLIC_AUTH_ENABLED" = false && test "$NEXT_PUBLIC_INDEXING_ENABLED" = false && test "$NEXT_PUBLIC_API_URL" = https://api.saitena.com && test "$NEXT_PUBLIC_CLIENT_AREA_URL" = https://portal.saitena.com && node scripts/check-release-readiness.mjs

FROM candidate AS release
COPY --from=release-review /app/docs/binary-review-manifest.json /app/release-assets.json
