FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . ./
ARG NEXT_PUBLIC_API_URL=https://api.saitena.com
ARG NEXT_PUBLIC_CLIENT_AREA_URL=https://portal.saitena.com
ARG NEXT_PUBLIC_AUTH_ENABLED=false
ARG NEXT_PUBLIC_INDEXING_ENABLED=false
ARG NEXT_PUBLIC_RELEASE_MODE=public
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_PUBLIC_CLIENT_AREA_URL=$NEXT_PUBLIC_CLIENT_AREA_URL NEXT_PUBLIC_AUTH_ENABLED=$NEXT_PUBLIC_AUTH_ENABLED NEXT_PUBLIC_INDEXING_ENABLED=$NEXT_PUBLIC_INDEXING_ENABLED NEXT_PUBLIC_RELEASE_MODE=$NEXT_PUBLIC_RELEASE_MODE SAITENA_RELEASE_MODE=$NEXT_PUBLIC_RELEASE_MODE NEXT_TELEMETRY_DISABLED=1
RUN case "$NEXT_PUBLIC_RELEASE_MODE" in public) ;; private-preview) SAITENA_DISPOSABLE_BUILD=true node scripts/prepare-private-preview.mjs ;; *) exit 1 ;; esac
RUN npm run build
FROM node:24-alpine AS candidate
ARG NEXT_PUBLIC_RELEASE_MODE=public
LABEL io.saitena.release-mode=$NEXT_PUBLIC_RELEASE_MODE
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
RUN node -e 'const fs=require("fs");if(process.env.SAITENA_RELEASE_MODE==="private-preview"&&!fs.existsSync("private-preview-prepared.json"))throw Error("Preview context required");fs.copyFileSync(process.env.SAITENA_RELEASE_MODE==="private-preview"?"docs/private-preview-assets.json":"docs/binary-review-manifest.json","release-assets.json")'

FROM candidate AS release
COPY --from=release-review /app/release-assets.json /app/release-assets.json
