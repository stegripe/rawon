<div align="center">
<img src="https://cdn.stegripe.org/images/rawon_splash.png" width="512">
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
- Basic music commands (play, pause, skip, queue, etc.)
- Multi-cookie rotation for uninterrupted playback
- Smart audio pre-caching for smoother playback
- Support for YouTube, Spotify, and SoundCloud
- Multi-bot support for running multiple bot instances simultaneously

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
- Cookie files for YouTube authentication (see [Cookies Setup](./docs/COOKIES_SETUP.md))

## Configuration Files
- `.env_example` - Essential settings (Discord token, prefix, Spotify, etc.)
- `optional.env_example` - Optional customization (colors, emojis, activities)
- `dev.env_example` - Developer settings (debug mode, dev IDs)

Use the ones you need/should and fill in the values.

## Multi-Bot Support

Run multiple bot instances from a single deployment - useful when you want multiple bots in the same Discord server using different voice channels.

### Setup
Add numbered tokens to your `.env` file:
```
DISCORD_TOKEN_1="your_first_bot_token"
DISCORD_TOKEN_2="your_second_bot_token"
DISCORD_TOKEN_3="your_third_bot_token"
```

Each bot operates independently with its own voice connections, queues, and commands. You can also use `DISCORD_TOKEN` alongside numbered tokens - it will be included as the first bot.

## Documentation
- [Disclaimers](./docs/DISCLAIMERS.md) - Important legal information
- [Cookies Setup](./docs/COOKIES_SETUP.md) - Fix "Sign in to confirm you're not a bot" errors on hosting providers

### Common Issues

**"Sign in to confirm you're not a bot" errors?**

If you're hosting on cloud providers (AWS, GCP, Azure, Railway, etc.), you may encounter bot detection errors. See [Cookies Setup](./docs/COOKIES_SETUP.md) for the solution.

**Quick fix using the cookies command:**
```
!cookies add 1    # Attach your cookies.txt file
!cookies list     # Check cookie status
!cookies reset    # Reset failed status
```

## Support & Questions
For help and questions, join our official [Discord Server](https://stegripe.org/discord).

## Contributors

### Developers
- [Stegripe Developers](https://github.com/orgs/stegripe/teams/developer)

### Translators
- [Stegripe Developers](https://github.com/orgs/stegripe/teams/developer) (en-US, id-ID, ko-KR)
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
