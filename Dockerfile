FROM ghcr.io/hazmi35/node:24-dev-alpine as build-stage

# Prepare pnpm with corepack (experimental feature)
RUN corepack enable && corepack prepare pnpm@latest

# Set working directory for build files
WORKDIR /tmp/build

# Copy package.json, lockfile and npm config files
COPY package.json pnpm-lock.yaml *.npmrc ./

# Copy .git directory for accessing commit hash
COPY .git .git

# Fetch dependencies to virtual store
RUN pnpm fetch

# Install dependencies
RUN pnpm install --offline --frozen-lockfile

# Copy Project files
COPY . .

# Build TypeScript Project
RUN pnpm run build

# Generate commit hash file for production use
RUN git rev-parse --short HEAD > commit-hash.txt 2>/dev/null || echo "???" > commit-hash.txt

# Prune devDependencies
RUN pnpm prune --production

# Start new production stage
FROM ghcr.io/hazmi35/node:24-alpine

LABEL name="rawon"
LABEL maintainer="Stegripe Development <support@stegripe.org>"

# Install ffmpeg, python3, and deno (JavaScript runtime for yt-dlp signature solving)
RUN apk add --no-cache ffmpeg python3 deno && ln -sf python3 /usr/bin/python

# Create necessary directory for caching
RUN mkdir -p /app/cache

# Create empty data.json for persistence cache volume mount
RUN echo "{}" > /app/cache/data.json

# Copy needed files
COPY --from=build-stage /tmp/build/package.json .
COPY --from=build-stage /tmp/build/node_modules ./node_modules
COPY --from=build-stage /tmp/build/dist ./dist
COPY --from=build-stage /tmp/build/src/utils/yt-dlp ./src/utils/yt-dlp
COPY --from=build-stage /tmp/build/lang ./lang
COPY --from=build-stage /tmp/build/index.js ./index.js
COPY --from=build-stage /tmp/build/commit-hash.txt /app/commit-hash.txt

# Additional Environment Variables
ENV NODE_ENV production

# Start the app with node
CMD ["node", "--es-module-specifier-resolution=node", "index.js"]
