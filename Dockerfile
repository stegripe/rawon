FROM node:16.9.1-alpine as build-stage

LABEL name "Disc 11 (build stage)"
LABEL maintainer "Zhycorp <support@zhycorp.net>"

WORKDIR /tmp/build

RUN apk add --no-cache build-base git python3

COPY package.json .
COPY package-lock.json .

RUN npm config set jobs max --global

RUN npm install

COPY . .

RUN npm run build

RUN npm prune --production

FROM node:16.9.1-alpine

LABEL name "Disc 11"
LABEL maintainer "Zhycorp <support@zhycorp.net>"

WORKDIR /app

RUN apk add --no-cache tzdata

COPY --from=build-stage /tmp/build/package.json .
COPY --from=build-stage /tmp/build/package-lock.json .
COPY --from=build-stage /tmp/build/node_modules ./node_modules
COPY --from=build-stage /tmp/build/dist ./dist

VOLUME ["/app/cache", "/app/logs"]

CMD ["node", "dist/main.js"]
