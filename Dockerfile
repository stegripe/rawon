FROM node:24-alpine AS build-stage

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /tmp/build

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc* ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

RUN pnpm prune --production

FROM node:24-alpine

LABEL name="rawon"
LABEL maintainer="Stegripe Development <support@stegripe.org>"

WORKDIR /app

RUN apk add --no-cache git ffmpeg python3 deno \
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
COPY --from=build-stage /tmp/build/.git ./.git

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "--es-module-specifier-resolution=node", "index.js"]
