FROM ghcr.io/hazmi35/node:24-dev-alpine as build-stage

# Prepare pnpm with corepack (experimental feature)
RUN corepack enable && corepack prepare pnpm@latest

# Copy package.json, lockfile and npm config files
COPY package.json pnpm-lock.yaml *.npmrc  ./

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

# Get ready for production
FROM ghcr.io/hazmi35/node:24-alpine

LABEL name "rawon"
LABEL maintainer "Stegripe Development <support@stegripe.org>"

# Install ffmpeg
RUN apk add --no-cache ffmpeg python3 && ln -sf python3 /usr/bin/python

# Copy needed files
COPY --from=build-stage /tmp/build/package.json .
COPY --from=build-stage /tmp/build/node_modules ./node_modules
COPY --from=build-stage /tmp/build/dist ./dist
COPY --from=build-stage /tmp/build/src/utils/yt-dlp ./src/utils/yt-dlp
COPY --from=build-stage /tmp/build/lang ./lang
COPY --from=build-stage /tmp/build/index.js ./index.js

# Create empty data.json for persistence volume mount
RUN echo '{}' > /app/data.json

# Additional Environment Variables
ENV NODE_ENV production

# Start the app with node
CMD ["node", "--es-module-specifier-resolution=node", "index.js"]
