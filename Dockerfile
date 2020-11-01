FROM node:14-alpine as build-stage

LABEL name "Disc 11 (build stage)"
LABEL maintainer "Zhycorp <support@zhycorp.xyz>"

LABEL original-maintainer "Hazmi35 <contact@hzmi.xyz>"

WORKDIR /tmp/build

# Install node-gyp dependencies
RUN apk add --no-cache build-base curl git python3

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
FROM node:14-alpine

WORKDIR /app

LABEL name "Disc 11"
LABEL maintainer "Zhycorp <support@zhycorp.xyz>"

LABEL original-maintainer "Hazmi35 <contact@hzmi.xyz>"

# Copy needed files
COPY --from=build-stage /tmp/build/package.json .
COPY --from=build-stage /tmp/build/yarn.lock .
COPY --from=build-stage /tmp/build/node_modules ./node_modules
COPY --from=build-stage /tmp/build/dist .

# Mark cache folder as docker volume
VOLUME ["/app/cache", "/app/logs"]

# Start the app with node
CMD ["node", "main.js"]