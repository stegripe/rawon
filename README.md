# Rawon

> A simple powerful Discord music bot built to fulfill your production desires. Easy to use, with no coding required.

<a href="https://discord.com/oauth2/authorize?client_id=999162626036740138&permissions=53857345&scope=bot"><img src="https://img.shields.io/static/v1?label=Invite%20Me&message=Rawon%232575&plastic&color=5865F2&logo=discord"></a>
<img src="https://badgen.net/badge/icon/typescript?icon=typescript&label">
<a href="https://github.com/stegripe/rawon/actions?query=workflow%3A%22Lint+code+and+compile+setup+script%22"><img src="https://github.com/stegripe/rawon/workflows/Lint%20code%20and%20compile%20setup%20script/badge.svg" alt="CI Status" /></a>

## Features
- Interaction support.
- Configurable, and easy to use.
- Basic music and moderation commands.
- A production-ready project, set up the bot without coding.

## General Setup
1. Download and install [Node.js](https://nodejs.org) version `16.6.0` or higher
2. Open the `.env_example` file and rename it to `.env`
3. Install required and optional dependencies. You still can use `npm` too.
```sh
$ pnpm install
```
4. Compile the file
```sh
$ pnpm run build
```
5. If you want to save your disk spaces, let's prune the dev dependencies
```sh
$ pnpm prune --production
```
6. Finally, you can start the bot
```sh
$ pnpm start
```

### Docker
You can use our official Docker image:
```bash
$ docker run -v ./scripts:/app/scripts --env-file ./.env -d ghcr.io/stegripe/rawon:latest 
```

...or with docker-compose:
```yml
services:
  rawon:
    image: ghcr.io/stegripe/rawon:latest
    restart: unless-stopped
    env_file: .env
    volumes:
      - "./scripts:/app/scripts"
```

Don't forget to create `.env` file and fill environment values from `.env_example` file

NOTE: You **must** attach `/app/scripts` volume if you use `yt-dlp` stream strategy.

### Railway
Railway provides $5 each month for you to use in the free plan, it will stay online 24/7 as long as your usage does not exceed $5.

**IMPORTANT:** Read [Disclaimers](./DISCLAIMERS.md) before deploying to Railway.

<a href="https://railway.app/new/template/PVZDzd?referralCode=TiaraR"><img src="https://railway.app/button.svg" alt="Deploy on Railway"
 /></a>
 
## Disclaimers
Disclaimers are listed on the [DISCLAIMERS.md](./DISCLAIMERS.md) file.

## Project Contributors

### Developers
- [@mzrtamp](https://github.com/mzrtamp)
- [@Tiramitzu](https://github.com/Tiramitzu)
- [@noxyzm](https://github.com/noxyzm)
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

> © 2025 Stegripe Development
