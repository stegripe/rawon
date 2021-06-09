# Disc 11 by Zhycorp
> A dedicated open-source Discord music bot for Zhycorp based on [Jukebox](https://github.com/Hazmi35/jukebox), easy to use, and with no coding required.

<a href="https://zhycorp.net/discord"><img src="https://img.shields.io/discord/332877090003091456?color=7289da&logo=discord&logoColor=white" alt="Discord server" /></a>
<a href="https://discord.com/oauth2/authorize?client_id=690736793682968576&permissions=53857345&scope=bot"><img src="https://img.shields.io/static/v1?label=Invite%20Me&message=Disc%2011%230606&plastic&color=7289DA&logo=discord"></a>
<img src="https://badgen.net/badge/icon/typescript?icon=typescript&label">
<a href="https://github.com/zhycorp/disc-11/actions?query=workflow%3A%22Lint+code+%26+compile+test%22"><img src="https://github.com/zhycorp/disc-11/workflows/Lint%20code%20&%20compile%20test/badge.svg" alt="CI Status" /></a>

## Usage

**Requires [Node.js](https://nodejs.org) version v14.x or above.**

1. Install [Node.js](https://nodejs.org)
2. Delete old `.env`, rename `.env.schema` to `.env` and fill out the values (example on .env.example)
3. Install dependencies as stated [here](https://github.com/zhycorp/disc-11#Installation) before you continue surfing
4. Run `npm run build` using Node package manager
5. Optional thing, prune dev dependencies (this is good to save disk spaces):
```sh
$ npm prune --production
```
6. Start it with `npm start`, and you're done!

Notes: 
1. You only need to configure `.env` file when you're using the [Docker image](https://github.com/zhycorp/disc-11#Docker)
2. If you're using **Deploy to Heroku** button, you don't need to do this.

## Installation

Without optional packages:
```sh
$ npm install --no-optional
```

With optional packages (recommended):
```sh
$ npm install
```
For optional packages, you need to install build tools as stated [here](https://github.com/nodejs/node-gyp#installation) and you also need to install [Git](https://git-scm.com/).

## Heroku
This clone project is still supports [Heroku](https://heroku.com) host because the [original project](https://github.com/Hazmi35/jukebox) is using this.

<a href="https://heroku.com/deploy"><img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy"></a>

## Glitch
You can still use Glitch and keep it online in this project, no worries 😉

1. Go to [glitch.com](https://glitch.com) and make an account
2. Click **New Project**, and then **Import from GitHub**
3. Please specify the field with `https://github.com/zhycorp/disc-11`, then wait for a while
4. Find the file names `.env.schema` then rename it to `.env`, let's configure that
5. Get your bot token at [Discord developer portal](https://discord.com/developers/applications) then invite it to your server, and fill the bot prefix with anything you want
8. To get an YouTube API v3 Key, please watch [this video](https://youtu.be/K2nqthN1xKQ?t=203) carefully
9. Specify another options on that file. If you don't know how, there's `.env.example` so you can know what it should looks like
10. After that, go to **Tools** > **Terminal** type `refresh`
11. Close **Terminal** tab, then open **Tools** > **Logs**, wait for a while
13. To make it stay online, please watch [this video](https://youtu.be/K2nqthN1xKQ?t=551) carefully.

Your bot is online, and ready to use!
If you have any questions or need support, feel free to join our [Discord server](https://zhycorp.net/discord).

## Docker
Want to use Dockerized version of [this project](https://github.com/Hazmi35/jukebox)?
Sure, we have provided them on the [Docker Hub](https://hub.docker.com/r/hazmi35/jukebox), and also in [GitHub Container Registry](https://github.com/users/Hazmi35/packages/container/package/jukebox).

### Volumes
[Docker Volumes](https://docs.docker.com/storage/volumes/) are needed to store cache and logs persistently.

### Example
```sh
$ docker run --env-file .env --volume cache:/app/cache --volume logs:/app/logs --restart unless-stopped hazmi35/jukebox
```
We also provide [docker-compose.yml](docker-compose.yml) if you want to go that way.

### Compose Example
```sh
$ docker-compose up
```

## Features
- Basic Commands (Help, Ping, Invite and Evaluate [for advanced bot owners])
- Basic Music Commands (Play, Skip, Stop, Pause, Resume, Repeat, Volume, Now Playing, and Queue)
- A production-ready music bot, suitable for you that don't like to hassling with the code
- Lightweight, only around 120MB with dev dependencies pruned
- Docker-friendly (if you're advanced user)
- Caching (cache youtube downloads)
- Configurable (easy to use)

Based on [jukebox](https://github.com/Hazmi35/jukebox)
