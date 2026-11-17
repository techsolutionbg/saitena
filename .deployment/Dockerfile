FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . ./
ARG NEXT_PUBLIC_API_URL=https://api.saitena.com
ARG NEXT_PUBLIC_CLIENT_AREA_URL=https://portal.saitena.com
ARG NEXT_PUBLIC_AUTH_ENABLED=false
ARG NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED=false
ARG NEXT_PUBLIC_CUSTOMER_REGISTRATION_ENABLED=false
ARG NEXT_PUBLIC_INDEXING_ENABLED=false
ARG NEXT_PUBLIC_RELEASE_MODE=public
ARG CONTACT_MAIL_MODE=disabled
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_PUBLIC_CLIENT_AREA_URL=$NEXT_PUBLIC_CLIENT_AREA_URL NEXT_PUBLIC_AUTH_ENABLED=$NEXT_PUBLIC_AUTH_ENABLED NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED=$NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED NEXT_PUBLIC_INDEXING_ENABLED=$NEXT_PUBLIC_INDEXING_ENABLED NEXT_PUBLIC_RELEASE_MODE=$NEXT_PUBLIC_RELEASE_MODE SAITENA_RELEASE_MODE=$NEXT_PUBLIC_RELEASE_MODE NEXT_TELEMETRY_DISABLED=1
ENV CONTACT_MAIL_MODE=$CONTACT_MAIL_MODE
ENV NEXT_PUBLIC_CUSTOMER_REGISTRATION_ENABLED=$NEXT_PUBLIC_CUSTOMER_REGISTRATION_ENABLED
RUN case "$NEXT_PUBLIC_RELEASE_MODE" in public|customer-auth) ;; private-preview) SAITENA_DISPOSABLE_BUILD=true node scripts/prepare-private-preview.mjs ;; public-demo) SAITENA_DISPOSABLE_BUILD=true node scripts/prepare-public-demo.mjs ;; *) exit 1 ;; esac
RUN npm run build
FROM node:24-alpine AS candidate
ARG NEXT_PUBLIC_RELEASE_MODE=public
LABEL io.saitena.release-mode=$NEXT_PUBLIC_RELEASE_MODE
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 CONTACT_MAIL_MODE=disabled
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build /app/node_modules/@fontsource-variable/manrope/LICENSE /app/licenses/manrope-OFL.txt
COPY --from=build /app/node_modules/@fontsource/lora/LICENSE /app/licenses/lora-OFL.txt
ENV HOSTNAME=0.0.0.0 PORT=3000
USER node
EXPOSE 3000
CMD ["node", "server.js"]

FROM build AS release-review
RUN if [ "$NEXT_PUBLIC_RELEASE_MODE" = customer-auth ]; then node scripts/customer-auth-release.mjs; else test "$NEXT_PUBLIC_AUTH_ENABLED" = false && test "$NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED" = false && test "$NEXT_PUBLIC_INDEXING_ENABLED" = false && test "$NEXT_PUBLIC_API_URL" = https://api.saitena.com && test "$NEXT_PUBLIC_CLIENT_AREA_URL" = https://portal.saitena.com && node scripts/check-release-readiness.mjs; fi
RUN node -e 'const fs=require("fs"),mode=process.env.SAITENA_RELEASE_MODE,marker=mode==="private-preview"?"private-preview-prepared.json":mode==="public-demo"?"public-demo-prepared.json":null;if(marker&&JSON.parse(fs.readFileSync(marker)).mode!==mode)throw Error("Matching build context required");fs.copyFileSync(mode==="private-preview"?"docs/private-preview-assets.json":["public-demo","customer-auth"].includes(mode)?"docs/public-demo-assets.json":"docs/binary-review-manifest.json","release-assets.json")'

FROM candidate AS release
COPY --from=release-review /app/release-assets.json /app/release-assets.json
