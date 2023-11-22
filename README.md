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

## Hosting Setup

Setup Tutorial Video (YouTube)

<a href="http://www.youtube.com/watch?feature=player_embedded&v=9csIDZYpaJM" target="_blank">
 <img src="http://img.youtube.com/vi/9csIDZYpaJM/0.jpg" alt="Setup Guide Video" width="360" border="10" />
</a>

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

### Glitch
You can use Glitch too for this project, featured with its code editor.

1. Star and fork this project
2. Go to [glitch.com](https://glitch.com) and make an account
3. Click **New Project** then **Import from GitHub**, specify the pop-up field with `https://github.com/<your-name>/rawon` (without `<>`)
4. Please wait for a while, this process takes some minutes
5. Find the `.env` file and delete it, then find `.env_example` file and rename it to `.env`
6. After specifying `.env`, open **Tools** > **Terminal**
7. Type `refresh`, and track the process from **Logs**

<a href="https://glitch.com/edit/#!/import/github/stegripe/rawon"><img src="https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg" alt="Remix on Glitch"></a>

### Railway
Railway provides $5 each month for you to use in the free plan, it will stay online 24/7 as long as your usage does not exceed $5.

**IMPORTANT:** Read [Disclaimers](./DISCLAIMERS.md) before deploying to Railway.

<a href="https://railway.app/new/template/PVZDzd?referralCode=TiaraR"><img src="https://railway.app/button.svg" alt="Deploy on Railway"
 /></a>
 
## Disclaimers
Disclaimers are listed on the [DISCLAIMERS.md](./DISCLAIMERS.md) file.

## Project Contributors

### Developers
- [@Mednoob](https://github.com/Mednoob)
- [@mzrtamp](https://github.com/mzrtamp)
- [@noxyzm](https://github.com/noxyzm)

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

> © 2023 Stegripe Development
