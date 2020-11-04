# Zhycorp Music Bot
> A dedicated open-source music bot for Zhycorp based on [Jukebox](https://github.com/Hazmi35/jukebox).

<a href="https://discord.gg/DxenCeV"><img src="https://img.shields.io/discord/332877090003091456?color=7289da&logo=discord&logoColor=white" alt="Discord server" /></a>
<a href="https://discord.com/oauth2/authorize?client_id=690736793682968576&permissions=53857345&scope=bot"><img src="https://img.shields.io/static/v1?label=Invite%20Me&message=Disc%2011%230606&plastic&color=7289DA&logo=discord"></a>
<a href="https://github.com/zhycorp/music-bot-example/actions?query=workflow%3A%22Node.js+CI%22"><img src="https://github.com/zhycorp/music-bot-example/workflows/Node.js%20CI/badge.svg" alt="Node.JS CI Status" /></a>
<img src="https://badgen.net/badge/icon/typescript?icon=typescript&label">
<img src="https://badgen.net/badge/jual/haram/red">

## Usage

**Requires [Node.JS](https://nodejs.org) version v12 or above.**

[Come here](https://github.com/zhycorp/disc-11#Glitch) if you want to use Glitch.com instead of localhost or [Heroku](https://heroku.com/deploy?template=https://github.com/zhycorp/disc-11/tree/master)

1. Install [Node.JS](https://nodejs.org) and [Yarn (Optional)](https://yarnpkg.com)
2. Rename `.env.schema` to `.env` and fill out the values (example on .env.example)
3. Install dependencies as stated [here](https://github.com/zhycorp/disc-11#Installation) before you continue surfing
4. Run `npm run build`, or `yarn run build` if you're using Yarn package manager
5. Optional thing, prune devDependencies (this is good to save disk spaces):
```shell script
$ npm prune --production
# or with yarn
$ yarn install --production
```
6. Start it with `npm start` or `yarn start`, and you're done!

Notes: 
1. You only need to configure .env file when you're using the [Docker image](https://github.com/zhycorp/disc-11#Docker)
2. If you're using "Deploy to Heroku" button, you don't need to do this.

## Installation

Without optional packages
```shell script
$ npm install --no-optional
# or with yarn
$ yarn install --ignore-optional
```

With optional packages (recommended)

```shell script
$ npm install
# or with yarn
$ yarn install
```
For optional packages, you need to install build tools as stated [here](https://github.com/nodejs/node-gyp#installation) and you also need to install [Git](https://git-scm.com/).

## Glitch
You can still use Glitch and keep it online in this project, no worries 😉

1. Go to [glitch.com](https://glitch.com) and make an account
2. Click **New Project**, and then **Import from GitHub**
3. Please specify the field with `https://github.com/zhycorp/disc-11`, then wait for a while
4. Find the file names `.env.schema` then rename it to `.env`, let's configure that
5. Get your bot token at [Discord developer portal](https://discord.com/developers/applications) then invite it to your server, and fill the bot prefix with anything you want
8. To get an YouTube API v3 Key, please watch [this video](https://youtu.be/6CSeovx0nvc?t=161) carefully
9. Specify another options on that file. If you don't know how, there's `.env.example` so you can know what it should looks like
10. After that, go to **Tools** > **Terminal** type `refresh`.
11. Close **Terminal** tab, then open **Tools** > **Logs**, wait for a while
13. To make it stay online, please watch [this video](https://youtu.be/6CSeovx0nvc?t=547) carefully

Your bot is online, and ready to use!
If you have any questions or need support, feel free to join our [Discord server](https://zhycorp.xyz/discord).

## Docker
Want to use Dockerized version of [this project](https://github.com/Hazmi35/jukebox)?
Sure, we have provided them on the [Docker Hub](https://hub.docker.com/r/hazmi35/jukebox).

### Volumes
[Docker Volumes](https://docs.docker.com/storage/volumes/) are needed to store cache and logs persistently.

### Example:
```shell
$ docker run --env-file .env --volume cache:/app/cache --volume logs:/app/logs hazmi35/jukebox
```
We also provide [docker-compose.yml](docker-compose.yml) if you want to go that way.

### Compose Example
```
$ docker-compose up
```

## Features
- A production-ready music bot, suitable for you that don't like to hassling with the code.
- Basic Commands (Help, Ping, Invite & Eval [for advanced bot owners])
- Basic Music Commands (Play, Skip, Stop, Pause & Resume, Now Playing, Queue, Repeat, Volume)
- Caching (cache youtube downloads)
- Configurable (easy to use)
- Docker-friendly (if you're advanced user)
- Lightweight (only around 150MB)

Based on [discord-music-bot](https://github.com/iCrawl/discord-music-bot) and reworked from [jukebox](https://github.com/Hazmi35/jukebox)