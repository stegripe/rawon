# Rawon

> A simple powerful Discord music bot built to fulfill your production desires. Easy to use, with no coding required.

<a href="https://discord.com/oauth2/authorize?client_id=999162626036740138&permissions=53857345&scope=bot"><img src="https://img.shields.io/static/v1?label=Invite%20Me&message=Rawon%232575&plastic&color=5865F2&logo=discord"></a>
<img src="https://badgen.net/badge/icon/typescript?icon=typescript&label">
<a href="https://github.com/stegripe/rawon/actions?query=workflow%3A%22Lint+code+and+compile+setup+script%22"><img src="https://github.com/stegripe/rawon/workflows/Lint%20code%20and%20compile%20setup%20script/badge.svg" alt="CI Status" /></a>

## Features
- Interaction support (slash commands and buttons).
- Request channel feature for a seamless music experience.
- A production-ready project, set up the bot without coding.
- Configurable, and easy to use.
- Basic music commands.

## General Setup
1. Download and install [Node.js](https://nodejs.org) version `22.12.0` or higher
2. Clone or download this repository
3. Rename `.env.example` to `.env` and fill in the required values
4. Install dependencies:
```sh
pnpm install
```
5. Build the project:
```sh
pnpm run build
```
6. (Optional) Prune dev dependencies to save disk space:
```sh
pnpm prune --production
```
7. Start the bot:
```sh
pnpm start
```
8. (Optional) Setup the special player channel:
`<prefix>requestchannel <#channel>` (Example: `xrequestchannel #rawon`)

## Docker Setup

### Using Docker Compose (Recommended)
1. Create a `.env` file with your configuration (copy from `.env.example`)
2. Start the bot:
```sh
docker compose up -d
```

Example `docker-compose.yaml`:
```yaml
services:
  rawon:
    image: ghcr.io/stegripe/rawon:latest
    container_name: rawon-bot
    restart: unless-stopped
    env_file: .env
    volumes:
      - rawon:/app/scripts
      - rawon-data:/app/data.json

volumes:
  rawon:
  rawon-data:
```

### Using Docker Run
```sh
docker run -d \
  --name rawon-bot \
  --env-file .env \
  -v rawon:/app/scripts \
  -v rawon-data:/app/data.json \
  --restart unless-stopped \
  ghcr.io/stegripe/rawon:latest
```

### Volume Explanations
- `/app/scripts` - Required if you use `yt-dlp` stream strategy (stores yt-dlp binary)
- `/app/data.json` - Stores persistent data like request channels and player settings

## Railway Deployment
Railway provides $5 each month for you to use in the free plan, it will stay online 24/7 as long as your usage does not exceed $5.

**IMPORTANT:** Read [Disclaimers](./DISCLAIMERS.md) before deploying to Railway.

<a href="https://railway.app/new/template/PVZDzd?referralCode=TiaraR"><img src="https://railway.app/button.svg" alt="Deploy on Railway" /></a>

## Environment Variables
See `.env.example` for all available configuration options. Key variables:
- `DISCORD_TOKEN` - Your Discord bot token (required)
- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` - Spotify API credentials (optional, for Spotify support)
- `MAIN_PREFIX` - Bot command prefix (default: `!`)
- `STREAM_STRATEGY` - `yt-dlp` (default) or `play-dl`

## Disclaimers
Disclaimers are listed on the [DISCLAIMERS.md](./DISCLAIMERS.md) file.

## Support & Questions
Only provided on our [Discord server](https://stegripe.org/discord).

## Project Contributors

### Developers
- [Developers](#developers)
- [@PixlGalaxy](https://github.com/PixlGalaxy)

### Translators
- [Developers](#developers) (en, id)
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
