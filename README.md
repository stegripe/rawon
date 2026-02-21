<div align="center">
<img src="https://cdn.stegripe.org/images/rawon_splash.png" width="512">
<br>
<a href="https://discord.com/oauth2/authorize?client_id=999162626036740138&permissions=4855722558221376&scope=bot%20applications.commands"><img src="https://img.shields.io/static/v1?label=Invite%20Me&message=Rawon%232575&plastic&color=5865F2&logo=discord"></a>
<img src="https://badgen.net/badge/icon/typescript?icon=typescript&label">
<a href="https://github.com/stegripe/rawon/actions?query=workflow%3A%22Lint+code+and+compile+setup+script%22"><img src="https://github.com/stegripe/rawon/workflows/Lint%20code%20and%20compile%20setup%20script/badge.svg" alt="CI Status" /></a>
</div>

# Rawon

> A simple powerful Discord music (multi-)bot built to fulfill your production desires. Easy to use, with no coding required.

## Features
- Production-ready, no coding required
- Request channel feature for seamless music experience
- Support for YouTube, Spotify, SoundCloud, and direct files
- Run multiple bot instances for different voice channels
- Smart audio pre-caching for smoother playback
- Built-in Google login via Puppeteer for cookie management

## Installation

### Prerequisites
- [Node.js](https://nodejs.org) version `20.0.0` or higher
- [Deno](https://deno.land/) runtime (required by yt-dlp for signature solving)
- [FFmpeg](https://ffmpeg.org/) for audio processing

> **Note**: Docker users don't need to install Deno or FFmpeg manually — they're included in the Docker image.

### Standard Setup (Node.js)
1. Download and install the prerequisites above
2. Clone or download this repository
3. Copy `.env.example` to `.env` and fill in the required values (at minimum: `DISCORD_TOKEN`)
4. Install dependencies:
```sh
pnpm install
```
5. Build the project:
```sh
pnpm run build
```
6. Start the bot:
```sh
pnpm start
```
7. (Optional) After the bot is online, set up a dedicated music channel:
```
<prefix>requestchannel <#channel>
```
Example: `!requestchannel #music-requests`

### Docker Setup (Recommended)

#### Using Docker Compose
1. Create a `.env` file with your configuration (copy from `.env.example`)
2. (Optional) Create `dev.env` for additional settings
3. Create a `docker-compose.yaml` file:
```yaml
services:
  rawon:
    image: ghcr.io/stegripe/rawon:latest
    container_name: rawon-bot
    restart: unless-stopped
    env_file:
      - .env
      - dev.env
    ports:
      - "${DEVTOOLS_PORT:-3000}:${DEVTOOLS_PORT:-3000}"
    volumes:
      - rawon:/app/cache

volumes:
  rawon:
```
4. Start the bot:
```sh
docker compose up -d
```
5. View logs:
```sh
docker logs -f rawon-bot
```

#### Using Docker Run
```sh
docker run -d \
  --name rawon-bot \
  --env-file .env \
  -p "${DEVTOOLS_PORT:-3000}:${DEVTOOLS_PORT:-3000}" \
  -v rawon:/app/cache \
  --restart unless-stopped \
  ghcr.io/stegripe/rawon:latest
```

#### Volume Information
The `/app/cache` volume stores:
- `yt-dlp` binary for audio streaming
- `data.*` for persistent settings (request channels, player states)
- Cached audio files (if audio caching is enabled)
- Cookie file and profile data from Google login (see [Cookies Setup](./docs/COOKIES_SETUP.md))

#### Port Information
The `DEVTOOLS_PORT` (default: `3000`) is used for Chrome DevTools remote debugging proxy. This is required for `!login start` to work from a remote machine. Set `DEVTOOLS_PORT` in your `dev.env` file to use a different port.

## Configuration Files
- `.env.example` - Essential settings (Discord/Spotify token, prefix, IDs, etc.)
- `dev.env.example` - Optional developer settings (prefix/slash toggles, sharding, DevTools, debug mode, etc.)
- Bot-specific settings (embed color, yes/no emoji, splash, alt prefix, default volume, selection type, audio cache) are managed via the `setup` command (developer-only) and stored in the database.

Use the ones you need/should and fill in the values.

### Multi-Bot Mode

Multi-bot mode is adaptive - no extra configuration needed!

- **Single token** = Single bot mode
- **Multiple tokens (comma-separated)** = Multi-bot mode automatically enabled

Example for multi-bot:
```env
DISCORD_TOKEN="token1, token2, token3"
```

Features:
- The first (order) token becomes the primary bot for general commands
- Each bot handles music commands for users in its voice channel
- Adaptive ordering - if the primary bot is not in a server, the next available bot takes over
- Each bot requires its own Discord application

## Documentation
- [Disclaimers](./docs/DISCLAIMERS.md) - Important legal information
- [Cookies Setup](./docs/COOKIES_SETUP.md) - Fix "Sign in to confirm you're not a bot" errors on hosting providers

### Common Issues

**"Sign in to confirm you're not a bot" errors?**

If you're hosting on cloud providers (AWS, GCP, Azure, Railway, etc.), you may encounter bot detection errors. See [Cookies Setup](./docs/COOKIES_SETUP.md) for the solution.

**Quick fix using the login command:**
```
!login start    # Opens a browser for Google login
!login status   # Check current login & cookie status
!login logout   # Clear the login session (wipes all cookies and profile data)
```

## Support & Questions
For help and questions, join our official [Discord Server](https://stegripe.org/discord).

## Contributors

### Developers
- [Stegripe Developers](https://github.com/orgs/stegripe/teams/developer)

### Translators
- [Stegripe Developers](https://github.com/orgs/stegripe/teams/developer) (en-US, id-ID, ko-KR, ms-MY)
- [@21Z](https://github.com/21Z) (en-US)
- [@lxndr-rl](https://github.com/lxndr-rl) (es-ES)
- [@MoustacheOff](https://github.com/MoustacheOff) (fr-FR)
- [@RabbitYuKu](https://github.com/RabbitYuKu) (zh-CN, zh-TW)
- [@RomaDevWorld](https://github.com/RomaDevWorld) (uk-UA)
- [@hmz121](https://github.com/hmz121) (vi-VN)
- [@melloirl](https://github.com/melloirl) (pt-BR)
- [@Ronner231](https://github.com/Ronner231) (ru-RU)
- [@Fyphen1223](https://github.com/Fyphen1223) (ja-JP)
- [@OsmanTunahan](https://github.com/OsmanTunahan) (tr-TR)

> © 2026 Stegripe Development
