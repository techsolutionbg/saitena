FROM node:24-alpine
WORKDIR /app
COPY .deployment/tests/fixture/ ./
COPY scripts/release-readiness.mjs scripts/check-release-readiness.mjs ./scripts/
RUN mkdir -p docs && node -e "const fs=require('fs'),crypto=require('crypto');fs.writeFileSync('docs/binary-review-manifest.json',JSON.stringify([{path:'public/test.txt',publicationRights:'approved',sha256:crypto.createHash('sha256').update(fs.readFileSync('public/test.txt')).digest('hex')}]))"
# A successful release gate is tested ONLY with an original, owned fixture.
RUN node scripts/check-release-readiness.mjs && cp docs/binary-review-manifest.json release-assets.json
ARG REVISION
LABEL org.opencontainers.image.revision=$REVISION
ENV VERSION=$REVISION
EXPOSE 3000
CMD ["node", "server.cjs"]
