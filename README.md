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

## Quick Start

### Standard Setup
1. Install [Node.js](https://nodejs.org) v22.12.0+
2. Clone this repository
3. Copy `.env_example` to `.env` and fill in values
4. Run:
```sh
pnpm install && pnpm run build && pnpm start
```

### Docker Setup
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
      - rawon:/app/cache

volumes:
  rawon:
```

## Documentation
- [Disclaimers](./docs/DISCLAIMERS.md) - Important legal information
- [Cookies Setup](./docs/COOKIES_SETUP.md) - For hosting providers with bot detection

## Railway Deployment
Read [Disclaimers](./docs/DISCLAIMERS.md) before deploying.

<a href="https://railway.app/new/template/PVZDzd?referralCode=TiaraR"><img src="https://railway.app/button.svg" alt="Deploy on Railway" /></a>

## Support
[Discord Server](https://stegripe.org/discord)

## Contributors

**Developers:** [@PixlGalaxy](https://github.com/PixlGalaxy)

**Translators:** [@21Z](https://github.com/21Z) (en) • [@lxndr-rl](https://github.com/lxndr-rl) (es) • [@MoustacheOff](https://github.com/MoustacheOff) (fr) • [@RabbitYuKu](https://github.com/RabbitYuKu) (zh-CN, zh-TW) • [@RomaDevWorld](https://github.com/RomaDevWorld) (uk) • [@hmz121](https://github.com/hmz121) (vi) • [@melloirl](https://github.com/melloirl) (pt-BR) • [@Ronner231](https://github.com/Ronner231) (ru) • [@Fyphen1223](https://github.com/Fyphen1223) (ja) • [@OsmanTunahan](https://github.com/OsmanTunahan) (tr)

> © 2026 Stegripe Development
