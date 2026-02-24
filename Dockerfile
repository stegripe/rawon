FROM node:24-alpine AS build-stage

RUN apk add --no-cache python3 make g++ git && \
    corepack enable && corepack prepare pnpm@10.12.1 --activate

WORKDIR /tmp/build

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc* ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN COMMIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "Unknown") && echo "COMMIT_SHA=$COMMIT_SHA" > /tmp/build/.env.build

RUN pnpm build

RUN pnpm prune --production

FROM node:24-alpine

LABEL name="rawon"
LABEL maintainer="Stegripe Development <support@stegripe.org>"

WORKDIR /app

RUN apk add --no-cache ffmpeg python3 \
    chromium nss freetype harfbuzz ca-certificates ttf-freefont \
    && ln -sf python3 /usr/bin/python

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROMIUM_PATH=/usr/bin/chromium-browser

RUN mkdir -p /app/cache /app/cache/cookies/browser-profile

COPY --from=build-stage /tmp/build/package.json .
COPY --from=build-stage /tmp/build/node_modules ./node_modules
COPY --from=build-stage /tmp/build/dist ./dist
COPY --from=build-stage /tmp/build/src/utils/yt-dlp ./src/utils/yt-dlp
COPY --from=build-stage /tmp/build/lang ./lang
COPY --from=build-stage /tmp/build/index.js ./index.js
COPY --from=build-stage /tmp/build/.env.build ./

ENV NODE_ENV=production

EXPOSE 3000

RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'set -a' >> /app/entrypoint.sh && \
    echo '[ -f .env.build ] && . ./.env.build' >> /app/entrypoint.sh && \
    echo 'set +a' >> /app/entrypoint.sh && \
    echo 'exec node --es-module-specifier-resolution=node index.js' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
