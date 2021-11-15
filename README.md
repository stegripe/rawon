![Splash](https://repository-images.githubusercontent.com/236645319/1da444e8-04ad-48a7-aee2-325cb3c7f6a7)

# Disc 11 by Zhycorp

> A dedicated open-source Discord bot for Zhycorp based from [our Discord bot template](https://github.com/zhycorp/discord-bot-template) with more features. Easy to use, and with no coding required.

<a href="https://zhycorp.net/discord"><img src="https://img.shields.io/discord/332877090003091456?color=5865F2&logo=discord&logoColor=white" alt="Discord Server" /></a>
<a href="https://discord.com/oauth2/authorize?client_id=690736793682968576&permissions=53857345&scope=bot"><img src="https://img.shields.io/static/v1?label=Invite%20Me&message=Disc%2011%230606&plastic&color=5865F2&logo=discord"></a>
<img src="https://badgen.net/badge/icon/typescript?icon=typescript&label">
<a href="https://github.com/zhycorp/disc-11/actions?query=workflow%3A%22Lint+code+%26+compile+test%22"><img src="https://github.com/zhycorp/disc-11/workflows/Lint%20code%20&%20compile%20test/badge.svg" alt="CI Status" /></a>

## Features
- Interaction support.
- Basic music commands.
- Basic moderation commands.
- Configurable, and easy to use.
- A production-ready project, set up the bot without coding.

## General Setup
1. Download and install [Node.js](https://nodejs.org) version `16.6.0` and [Python](https://python.org) version `3.6.0` or above
2. Open `.env_example` file and rename it to `.env`
3. Install required and optional dependencies
```sh
$ npm install
```
4. Compile the file
```sh
$ npm run build
```
5. If you want to save your disk spaces, let's prune the dev dependencies
```sh
$ npm prune --production
```
6. Finally, you can start the bot
```sh
$ npm start
```

## Hosting Setup

### Heroku
You can host this bot to make it stay online on Heroku.

<a href="https://heroku.com/deploy?template=https://github.com/zhycorp/disc-11"><img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy to Heroku"></a>

### Glitch
You can use Glitch too for this project, featured with its code editor.

> Watch the tutorial video on YouTube!
> 
> ▶️ **https://youtu.be/ILutlBl_Xyk**

1. Star and fork this project
2. Go to [glitch.com](https://glitch.com) and make an account
3. Click **New Project** then **Import from GitHub**, specify the pop-up field with `https://github.com/<your-name>/disc-11` (without `<>`)
4. Please wait for a while, this process takes some minutes
5. Find `.env` file and delete it, find `.env_example` file and rename it back to `.env`
6. After specifying `.env`, open **Tools** > **Terminal**
7. Type `refresh`, and track the process from **Logs**
8. To make the bot stay online, please watch [this video](https://youtu.be/K2nqthN1xKQ?t=551) carefully.

<a href="https://glitch.com/edit/#!/import/github/zhycorp/disc-11"><img src="https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg" alt="Remix on Glitch"></a>

> © 2021 Zhycorp Development
