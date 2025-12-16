FROM ghcr.io/hazmi35/node:24-dev-alpine as build-stage

RUN corepack enable && corepack prepare pnpm@latest

COPY package.json pnpm-lock.yaml *.npmrc  ./

RUN pnpm fetch

RUN pnpm install --offline --frozen-lockfile

COPY . .

RUN pnpm run build

RUN pnpm prune --production

FROM ghcr.io/hazmi35/node:24-alpine

LABEL name "rawon"
LABEL maintainer "Stegripe Development <support@stegripe.org>"

RUN apk add --no-cache ffmpeg python3 && ln -sf python3 /usr/bin/python

COPY --from=build-stage /tmp/build/package.json .
COPY --from=build-stage /tmp/build/node_modules ./node_modules
COPY --from=build-stage /tmp/build/dist ./dist
COPY --from=build-stage /tmp/build/yt-dlp-utils ./yt-dlp-utils
COPY --from=build-stage /tmp/build/lang ./lang
COPY --from=build-stage /tmp/build/index.js ./index.js

RUN echo '{}' > /app/data.json

ENV NODE_ENV production

CMD ["node", "--es-module-specifier-resolution=node", "index.js"]
