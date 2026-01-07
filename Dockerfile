FROM node:24-alpine AS build-stage

# Prepare pnpm with corepack (experimental feature)
RUN corepack enable && corepack prepare pnpm@latest

# Set working directory for build files
WORKDIR /tmp/build

# Copy package.json, lockfile and npm config files
COPY package.json pnpm-lock.yaml *.npmrc ./

# Fetch dependencies to virtual store
RUN pnpm fetch

# Install dependencies
RUN pnpm install --offline --frozen-lockfile

# Copy Project files
COPY . .

# Build TypeScript Project
RUN pnpm run build

# Prune devDependencies
RUN pnpm prune --production

# Start new production stage
FROM node:24-alpine

LABEL name="rawon"
LABEL maintainer="Stegripe Development <support@stegripe.org>"

# Install git, ffmpeg, python3, and deno (JavaScript runtime for yt-dlp signature solving)
RUN apk add --no-cache git ffmpeg python3 deno && ln -sf python3 /usr/bin/python

# Create necessary directory for caching (SQLite database will be stored here)
RUN mkdir -p /app/cache

# Copy needed files
COPY --from=build-stage /tmp/build/package.json .
COPY --from=build-stage /tmp/build/node_modules ./node_modules
COPY --from=build-stage /tmp/build/dist ./dist
COPY --from=build-stage /tmp/build/src/utils/yt-dlp ./src/utils/yt-dlp
COPY --from=build-stage /tmp/build/lang ./lang
COPY --from=build-stage /tmp/build/index.js ./index.js
COPY --from=build-stage /tmp/build/.git ./.git

# Additional Environment Variables
ENV NODE_ENV production

# Start the app with node
CMD ["node", "--es-module-specifier-resolution=node", "index.js"]
