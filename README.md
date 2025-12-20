<div align="center">
<img src="https://cdn.stegripe.org/images/rawon_splash.png" width="513">
<br>
<a href="https://discord.com/oauth2/authorize?client_id=999162626036740138&permissions=53857345&scope=bot"><img src="https://img.shields.io/static/v1?label=Invite%20Me&message=Rawon%232575&plastic&color=5865F2&logo=discord"></a>
<img src="https://badgen.net/badge/icon/typescript?icon=typescript&label">
<a href="https://github.com/stegripe/rawon/actions?query=workflow%3A%22Lint+code+and+compile+setup+script%22"><img src="https://github.com/stegripe/rawon/workflows/Lint%20code%20and%20compile%20setup%20script/badge.svg" alt="CI Status" /></a>
</div>

# Rawon

> A simple powerful Discord music bot built to fulfill your production desires. Easy to use, with no coding required.

## Features
- Interaction support (slash commands and buttons)
- Request channel feature for seamless music experience
- Production-ready, no coding required
- Configurable and easy to use
- Basic music commands (play, pause, skip, queue, etc.)

## Installation

### Standard Setup (Node.js)
1. Download and install [Node.js](https://nodejs.org) version `22.12.0` or higher
2. Clone or download this repository
3. Copy `.env_example` to `.env` and fill in the required values (at minimum: `DISCORD_TOKEN`)
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
1. Create a `.env` file with your configuration (copy from `.env_example`)
2. Create a `docker-compose.yaml` file:
```yaml
services:
  rawon:
    image: ghcr.io/stegripe/rawon:latest
    container_name: rawon-bot
    restart: unless-stopped
    env_file: .env
    volumes:
      - rawon:/app/cache

volumes:
  rawon:
```
3. Start the bot:
```sh
docker compose up -d
```
4. View logs:
```sh
docker logs -f rawon-bot
```

#### Using Docker Run
```sh
docker run -d \
  --name rawon-bot \
  --env-file .env \
  -v rawon:/app/cache \
  --restart unless-stopped \
  ghcr.io/stegripe/rawon:latest
```

#### Volume Information
The `/app/cache` volume stores:
- `yt-dlp` binary for audio streaming
- `data.json` for persistent settings (request channels, player states)
- Cached audio files (if audio caching is enabled)

### Railway Deployment
Railway provides $5 free credits monthly. Your bot will stay online 24/7 as long as usage stays under $5.

**⚠️ IMPORTANT:** Read [Disclaimers](./docs/DISCLAIMERS.md) before deploying to Railway.

<a href="https://railway.app/new/template/PVZDzd?referralCode=TiaraR"><img src="https://railway.app/button.svg" alt="Deploy on Railway" /></a>

## Configuration Files
- `.env_example` - Essential settings (Discord token, prefix, Spotify, etc.)
- `optional.env_example` - Optional customization (colors, emojis, activities)
- `dev.env_example` - Developer settings (debug mode, dev IDs)

Copy the ones you need to `.env` and fill in the values.

## Documentation
- [Disclaimers](./docs/DISCLAIMERS.md) - Important legal information
- [Cookies Setup](./docs/COOKIES_SETUP.md) - Fix "Sign in to confirm you're not a bot" errors on hosting providers

## Support & Questions
For help and questions, join our official [Discord Server](https://stegripe.org/discord).

## Contributors

### Developers
- [@PixlGalaxy](https://github.com/PixlGalaxy)

### Translators
- [@21Z](https://github.com/21Z) (en)
- [@lxndr-rl](https://github.com/lxndr-rl) (es)
- [@MoustacheOff](https://github.com/MoustacheOff) (fr)
- [@RabbitYuKu](https://github.com/RabbitYuKu) (zh-CN, zh-TW)
- [@RomaDevWorld](https://github.com/RomaDevWorld) (uk)
- [@hmz121](https://github.com/hmz121) (vi)
- [@melloirl](https://github.com/melloirl) (pt-BR)
- [@Ronner231](https://github.com/Ronner231) (ru)
- [@Fyphen1223](https://github.com/Fyphen1223) (ja)
- [@OsmanTunahan](https://github.com/OsmanTunahan) (tr)

> © 2026 Stegripe Development
