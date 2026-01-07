FROM ghcr.io/hazmi35/node:24-dev-alpine as build-stage

RUN corepack enable && corepack prepare pnpm@latest

WORKDIR /tmp/build

COPY package.json pnpm-lock.yaml *.npmrc ./

COPY .git .git

RUN pnpm fetch

RUN pnpm install --offline --frozen-lockfile

COPY . .

RUN pnpm run build

RUN git rev-parse --short HEAD > commit-hash.txt 2>/dev/null || echo "???" > commit-hash.txt

RUN pnpm prune --production

FROM ghcr.io/hazmi35/node:24-alpine

LABEL name="rawon"
LABEL maintainer="Stegripe Development <support@stegripe.org>"

RUN apk add --no-cache ffmpeg python3 deno && ln -sf python3 /usr/bin/python

RUN mkdir -p /app/cache

COPY --from=build-stage /tmp/build/package.json .
COPY --from=build-stage /tmp/build/node_modules ./node_modules
COPY --from=build-stage /tmp/build/dist ./dist
COPY --from=build-stage /tmp/build/src/utils/yt-dlp ./src/utils/yt-dlp
COPY --from=build-stage /tmp/build/lang ./lang
COPY --from=build-stage /tmp/build/index.js ./index.js
COPY --from=build-stage /tmp/build/commit-hash.txt /app/commit-hash.txt

ENV NODE_ENV production

CMD ["node", "--es-module-specifier-resolution=node", "index.js"]
