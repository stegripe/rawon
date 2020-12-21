FROM node:14.15.3-alpine as build-stage

LABEL name "Disc 11 (build stage)"
LABEL maintainer "Zhycorp <support@zhycorp.com>"

LABEL original-maintainer "Hazmi35 <contact@hzmi.xyz>"

WORKDIR /tmp/build

# Install node-gyp dependencies
RUN apk add --no-cache build-base git python3

# Copy package.json and yarn.lock
COPY package.json .
COPY yarn.lock .

# Install dependencies
RUN yarn install

# Copy Project files
COPY . .

# Build TypeScript Project
RUN yarn run build

# Prune devDependencies
RUN yarn install --production

# Get ready for production
FROM node:14.15.3-alpine

LABEL name "Disc 11"
LABEL maintainer "Zhycorp <support@zhycorp.com>"

LABEL original-maintainer "Hazmi35 <contact@hzmi.xyz>"

WORKDIR /app

# Install dependencies
RUN apk add --no-cache tzdata

# Copy needed files
COPY --from=build-stage /tmp/build/package.json .
COPY --from=build-stage /tmp/build/yarn.lock .
COPY --from=build-stage /tmp/build/node_modules ./node_modules
COPY --from=build-stage /tmp/build/dist .

# Mark cache folder as docker volume
VOLUME ["/app/cache", "/app/logs"]

# Start the app with node
CMD ["node", "main.js"]