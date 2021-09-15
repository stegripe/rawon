FROM node:16.9.1-alpine as build-stage

# NOTE: Change these as you want
LABEL name "disc-11 (build-stage)"
LABEL maintainer "Zhycorp <support@zhycorp.net>"

WORKDIR /tmp/build

# Install build tools for node-gyp
RUN apk add --no-cache build-base git python3

# Copy package.json and package-lock.json
COPY package.json .
COPY package-lock.json .

# Install node dependencies
RUN npm install

# Now copy project files
COPY . .

# Build typescript project
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Get ready for production
FROM node:16.9.1-alpine

# NOTE: Change these as you want
LABEL name "disc-11"
LABEL maintainer "Zhycorp <support@zhycorp.net>"

WORKDIR /app

# Install dependencies
RUN apk add --no-cache tzdata

# Copy needed project files
COPY --from=build-stage /tmp/build/package.json .
COPY --from=build-stage /tmp/build/package-lock.json .
COPY --from=build-stage /tmp/build/node_modules ./node_modules
COPY --from=build-stage /tmp/build/dist ./dist

VOLUME [ "/app/logs" ]

CMD ["node", "dist/index.js"]
