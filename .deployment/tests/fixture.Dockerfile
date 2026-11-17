FROM node:24-alpine
WORKDIR /app
COPY .deployment/tests/fixture/ ./
COPY scripts/release-readiness.mjs scripts/check-release-readiness.mjs ./scripts/
RUN mkdir -p docs && node -e "const fs=require('fs'),crypto=require('crypto');fs.writeFileSync('docs/binary-review-manifest.json',JSON.stringify([{path:'public/test.txt',publicationRights:'approved',sha256:crypto.createHash('sha256').update(fs.readFileSync('public/test.txt')).digest('hex')}]))"
# A successful release gate is tested ONLY with an original, owned fixture.
RUN node -e "require('fs').writeFileSync('docs/release-approval.json',JSON.stringify({company_data_approved:true,legal_copy_approved:true,contact_details_approved:true,deployment_plan_approved:true}))"
RUN node scripts/check-release-readiness.mjs && cp docs/binary-review-manifest.json release-assets.json
ARG REVISION
ARG RELEASE_MODE=public
LABEL org.opencontainers.image.revision=$REVISION
LABEL io.saitena.release-mode=$RELEASE_MODE
ENV VERSION=$REVISION RELEASE_MODE=$RELEASE_MODE
EXPOSE 3000
CMD ["node", "server.cjs"]
