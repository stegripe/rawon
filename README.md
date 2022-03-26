![Splash](https://repository-images.githubusercontent.com/236645319/8a781f4e-6955-499a-9e88-380c5adccfa5)

# Rawon

> A simple powerful Discord music bot built to fulfill your production desires. Easy to use, with no coding required.

<a href="https://discord.com/oauth2/authorize?client_id=711712829031448637&permissions=53857345&scope=bot"><img src="https://img.shields.io/static/v1?label=Invite%20Me&message=Rawon%237022&plastic&color=5865F2&logo=discord"></a>
<img src="https://badgen.net/badge/icon/typescript?icon=typescript&label">
<a href="https://github.com/Rahagia/rawon/actions?query=workflow%3A%22Lint+code+%26+compile+test%22"><img src="https://github.com/Rahagia/rawon/workflows/Lint%20code%20&%20compile%20test/badge.svg" alt="CI Status" /></a>

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

<a href="https://heroku.com/deploy?template=https://github.com/Rahagia/rawon"><img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy to Heroku"></a>

### Glitch
You can use Glitch too for this project, featured with its code editor.

1. Star and fork this project
2. Go to [glitch.com](https://glitch.com) and make an account
3. Click **New Project** then **Import from GitHub**, specify the pop-up field with `https://github.com/<your-name>/rawon` (without `<>`)
4. Please wait for a while, this process takes some minutes
5. Find `.env` file and delete it, find `.env_example` file and rename it back to `.env`
6. After specifying `.env`, open **Tools** > **Terminal**
7. Type `refresh`, and track the process from **Logs**

<a href="https://glitch.com/edit/#!/import/github/Rahagia/rawon"><img src="https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg" alt="Remix on Glitch"></a>

### Railway
Railway provide $5 each month for you to use in free plan, it will stay online 24/7 as long as your usage does not exceed $5.

**IMPORTANT:** Read [Disclaimers](./DISCLAIMERS.md) before deploying to Railway.

<a href="https://railway.app/new/template?template=https%3A%2F%2Fgithub.com%2FRahagia%2Frawon&envs=DISCORD_TOKEN%2CMAIN_PREFIX%2CALT_PREFIX%2CEMBED_COLOR%2CLOCALE%2CACTIVITIES%2CACTIVITY_TYPES%2COWNERS%2CDEV_GUILD%2CNODE_ENV%2CSTREAM_STRATEGY%2CENABLE_SLASH_COMMAND%2CMUSIC_SELECTION_TYPE%2CENABLE_24_7_COMMAND%2CSTAY_IN_VC_AFTER_FINISHED%2CDJ_ROLE_NAME%2CMUTE_ROLE_NAME%2CYES_EMOJI%2CNO_EMOJI&optionalEnvs=MAIN_PREFIX%2CALT_PREFIX%2CEMBED_COLOR%2CLOCALE%2COWNERS%2CDEV_GUILD%2CNODE_ENV%2CSTREAM_STRATEGY%2CENABLE_SLASH_COMMAND%2CMUSIC_SELECTION_TYPE%2CENABLE_24_7_COMMAND%2CSTAY_IN_VC_AFTER_FINISHED%2CDJ_ROLE_NAME%2CMUTE_ROLE_NAME%2CYES_EMOJI%2CNO_EMOJI&DISCORD_TOKENDesc=Example%3A+NTE5NjQ2MjIxNTU2Nzc2OTcw.XAcEQQ.0gjhNbGeWBsKP6FVuIyZWlG2cMd&MAIN_PREFIXDesc=What+should+be+the+main+prefix+of+your+bot%3F&ALT_PREFIXDesc=For+More+Detailed+Info+See+https%3A%2F%2Fgithub.com%2FRahagia%2Frawon%2Fblob%2Fmain%2F.env_example&EMBED_COLORDesc=For+More+Detailed+Info+See+https%3A%2F%2Fgithub.com%2FRahagia%2Frawon%2Fblob%2Fmain%2F.env_example&LOCALEDesc=For+More+Detailed+Info+See+https%3A%2F%2Fgithub.com%2FRahagia%2Frawon%2Fblob%2Fmain%2F.env_example&ACTIVITIESDesc=For+More+Detailed+Info+See+https%3A%2F%2Fgithub.com%2FRahagia%2Frawon%2Fblob%2Fmain%2F.env_example&ACTIVITY_TYPESDesc=For+More+Detailed+Info+See+https%3A%2F%2Fgithub.com%2FRahagia%2Frawon%2Fblob%2Fmain%2F.env_example&OWNERSDesc=What+is+the+owner%27s+ID+of+the+bot%3F+Example%3A+%5B%22397322976552550400%22%5D&DEV_GUILDDesc=What+is+your+server%27s+ID%3F+Example%3A+%22332877090003091456%22&NODE_ENVDesc=In+which+mode+do+you+want+to+activate+your+bot%3F+Available%3A+production%2C+development&STREAM_STRATEGYDesc=Which+youtube+downloader+do+you+want+to+use%3F+Note%3A+if+you+use+play-dl%2C+it+will+support+a+few+sites.+Available%3A+play-dl%2C+youtube-dl&ENABLE_SLASH_COMMANDDesc=Do+you+want+to+enable+slash+command+support%3F&MUSIC_SELECTION_TYPEDesc=For+More+Detailed+Info+See+https%3A%2F%2Fgithub.com%2FRahagia%2Frawon%2Fblob%2Fmain%2F.env_example&ENABLE_24_7_COMMANDDesc=Do+you+want+to+enable+the+24%2F7+command%3F&STAY_IN_VC_AFTER_FINISHEDDesc=Do+you+want+to+make+your+bot+not+leave+the+voice+channel+after+playing+a+song%3F&DJ_ROLE_NAMEDesc=What+is+your+server%27s+DJ+role+name%3F&MUTE_ROLE_NAMEDesc=What+is+your+server%27s+Muted+role+name%3F&YES_EMOJIDesc=What+should+be+your+bot%27s+emoji+for+every+success+sentence%3F&NO_EMOJIDesc=What+should+be+your+bot%27s+emoji+for+every+failed+sentence%3F&MAIN_PREFIXDefault=%21&ALT_PREFIXDefault=%5B%22%7Bmention%7D%22%5D&EMBED_COLORDefault=3CAAFF&LOCALEDefault=en&ACTIVITIESDefault=%5B%22My+default+prefix+is+%7Bprefix%7D%22%2C+%22music+with+%7BuserCount%7D+users%22%2C+%22%7BtextChannelsCount%7D+text+channels+in+%7BserverCount%7D+guilds%22%2C+%22Hello+there%2C+my+name+is+%7Busername%7D%22%5D&ACTIVITY_TYPESDefault=%5B%22PLAYING%22%2C+%22LISTENING%22%2C+%22WATCHING%22%2C+%22PLAYING%22%2C+%22COMPETING%22%5D&NODE_ENVDefault=production&STREAM_STRATEGYDefault=youtube-dl&ENABLE_SLASH_COMMANDDefault=yes&MUSIC_SELECTION_TYPEDefault=message&ENABLE_24_7_COMMANDDefault=no&STAY_IN_VC_AFTER_FINISHEDDefault=no&DJ_ROLE_NAMEDefault=DJ&MUTE_ROLE_NAMEDefault=Muted&YES_EMOJIDefault=%E2%9C%85&NO_EMOJIDefault=%E2%9D%8C&referralCode=TiaraR"><img src="https://railway.app/button.svg" alt="Deploy on Railway"
 /></a>

## Project Maintainer
- [@Mednoob](https://github.com/Mednoob)
- [@mzrtamp](https://github.com/mzrtamp)

## Disclaimers
Disclaimers are listed on the [DISCLAIMERS.md](./DISCLAIMERS.md) file.

> © 2022 RB Project
