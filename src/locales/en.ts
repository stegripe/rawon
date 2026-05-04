export const en = {
    nav: {
        home: "Home",
        docs: "Docs",
        gettingStarted: "Getting Started",
        configuration: "Configuration",
        cookiesSetup: "Cookies Setup",
        disclaimers: "Disclaimers",
        permissionCalculator: "Permission Calculator",
        links: "Links"
    },

    home: {
        title: "Rawon",
        description:
            "A simple powerful Discord music (multi-)bot built to fulfill your production desires. Easy to use, with no coding required.",
        invite: "Invite",
        inviteBot: "Invite Bot",
        support: "Support",
        viewDocs: "View Docs"
    },

    gettingStarted: {
        title: "Getting Started",
        subtitle:
            "Get Rawon up and running in minutes with our step-by-step guide.",
        features: {
            title: "✨ Features",
            items: [
                "🚀 Production-ready, no coding required",
                "📺 Request channel feature for seamless music experience",
                "🎶 Support for YouTube, Spotify, SoundCloud, and direct files",
                "🤖 Run multiple bot instances for different voice channels",
                "⚡ Smart audio pre-caching for smoother playback",
                "🍪 Built-in Google login via Puppeteer for cookie management"
            ]
        },
        requirements: {
            title: "📋 Requirements",
            nodeVersion: "**Node.js** version `20.0.0` or higher",
            discordToken:
                "**Discord Bot Token** (get from [Discord Developer Portal](https://discord.com/developers/applications))",
            optional: "**Optional:** [FFmpeg](https://ffmpeg.org/) for audio processing on standard (non-Docker) installs — Docker images include FFmpeg"
        },
        standardSetup: {
            title: "💻 Standard Setup (Node.js)",
            steps: [
                "Download and install the prerequisites above",
                "Clone or download this repository",
                "Copy `.env.example` to `.env` and fill in the required values (at minimum: `DISCORD_TOKEN`)",
                "Install dependencies: `pnpm install`",
                "Build the project: `pnpm run build`",
                "Start the bot: `pnpm start`"
            ],
            requestChannel:
                "(Optional) After the bot is online, set up a dedicated music channel:"
        },
        dockerSetup: {
            title: "🐳 Docker Setup (Recommended)",
            composeTitle: "Using Docker Compose",
            composeSteps: [
                "Create a `.env` file with your configuration (copy from `.env.example`)",
                "(Optional) Create `dev.env` from `dev.env.example` for additional settings",
                "Create a `docker-compose.yaml` file (see example below)",
                "Start the bot: `docker compose up -d`",
                "View logs: `docker logs -f rawon-bot`"
            ],
            runTitle: "Using Docker Run",
            volumeInfo: {
                title: "📁 Volume Information",
                description: "The `/app/cache` volume stores:",
                items: [
                    "`yt-dlp` binary for audio streaming",
                    "`data.*` for persistent settings (request channels, player states)",
                    "Cached audio files (if audio caching is enabled)",
                    "Cookie file and profile data from Google login (see [Cookies Setup](/docs/cookies-setup))"
                ]
            },
            portInfo: {
                title: "🔌 Port information",
                description:
                    "`DEVTOOLS_PORT` (default: `3000`) is used for the Chrome DevTools remote debugging proxy. This is required for `!login start` when you connect from another machine. Set `DEVTOOLS_PORT` in `dev.env` to use a different port, and map it in Docker Compose or `docker run`."
            }
        },

        cookiesQuickStart: {
            title: "🍪 Cookies: quick fix on hosting",
            description:
                "On cloud hosts (AWS, GCP, Azure, Railway, etc.) you may see **\"Sign in to confirm you're not a bot\"**. Use the built-in login flow:",
            steps: [
                "Run `!login start` in Discord",
                "Open the DevTools URL the bot sends you and complete Google login in the remote browser",
                "Use `!login status` to check cookies, or `!login logout` then `!login start` to refresh"
            ],
            tip: "💡 Use a **throwaway Google account**, not your main account. See the full [Cookies Setup](/docs/cookies-setup) guide for details."
        }
    },

    configuration: {
        title: "Configuration",
        subtitle: "How Rawon’s configuration files and environment variables fit together.",
        overview: {
            title: "📄 Configuration files",
            intro: "Settings are split across a few files on purpose:",
            items: [
                "**`.env.example`** — Essential settings (Discord/Spotify tokens, prefix, IDs, activities, etc.). Copy to **`.env`** and fill in values.",
                "**`dev.env.example`** — Optional developer settings (prefix/slash toggles, sharding, DevTools port for `!login`, Chromium path, debug mode). Copy to **`dev.env`** when needed.",
                "**`setup` command** — Bot-specific options (embed color, yes/no emoji, splash, alt prefix, default volume, selection type, audio cache) are managed via the **`setup` command** (developer-only) and stored in the database. Use `<prefix>setup view` to list available settings."
            ]
        },
        essential: {
            title: "⚡ Essential settings (`.env`)",
            description:
                "Values from `.env.example`. Only **`DISCORD_TOKEN`** is strictly required to run; add Spotify, lyrics token, and the rest as you need them.",
            discordToken: {
                name: "DISCORD_TOKEN",
                description:
                    "Your Discord bot token(s) from the [Discord Developer Portal](https://discord.com/developers/applications). Use **comma-separated** tokens to enable multi-bot mode.",
                required: true
            },
            spotify: {
                name: "Spotify API",
                description:
                    "Set `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` from [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard). **Required for Spotify support.**",
                required: false
            },
            stegripeLyrics: {
                name: "STEGRIPE_API_LYRICS_TOKEN",
                description:
                    "Required for accurate **lyrics** command output. Contact the developer for access.",
                required: false
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "Main command prefix. Example: `!` means you type `!play` to play music",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "Your main server ID for faster slash command registration. Leave empty for global commands (can take up to an hour to update)",
                required: false
            },
            devs: {
                name: "DEVS",
                description: "Bot developer user IDs (comma-separated). Developers can access special commands including `setup` and `login` tooling.",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Bot language for bot responses",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR, ko-KR"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "Activity types for each entry in `ACTIVITIES` (comma-separated). Must match the number of activities",
                options: "PLAYING, WATCHING, LISTENING, COMPETING",
                default: "PLAYING"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Bot status lines under the bot name (comma-separated). Placeholders: `{prefix}`, `{userCount}`, `{textChannelCount}`, `{serverCount}`, `{playingCount}`, `{username}`",
                required: false
            }
        },
        multiBot: {
            title: "🔄 Multi-bot mode",
            description:
                "Multi-bot mode is adaptive — **no extra configuration**. One token runs a single bot; **comma-separated** tokens enable multi-bot automatically.",
            example: "Example:",
            exampleCode: 'DISCORD_TOKEN="token1, token2, token3"',
            features: [
                "The **first** token is the primary bot for general commands",
                "Each bot serves music for users in **its** voice channel",
                "If the primary bot is not in a server, the next available bot can take over",
                "Each bot needs its **own** Discord application"
            ]
        },
        developer: {
            title: "🛠️ Developer settings (`dev.env`)",
            description: "From `dev.env.example`. **Optional** — only change these if you understand them.",
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "Enable or disable prefix commands (e.g. `!play`)",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "Enable or disable slash commands (e.g. `/play`)",
                default: "yes",
                options: "yes, no"
            },
            enableSharding: {
                name: "ENABLE_SHARDING",
                description: "Enable sharding for large bots (**single-token mode only**)",
                default: "no",
                options: "yes, no"
            },
            devtoolsPort: {
                name: "DEVTOOLS_PORT",
                description:
                    "Port for the Chrome DevTools remote debugging proxy. Used by `!login start` when DevTools is opened from another machine. Default: `3000`",
                default: "3000"
            },
            chromiumPath: {
                name: "CHROMIUM_PATH",
                description: "Path to Chrome/Chromium for Google login. Leave empty for auto-detection",
                required: false
            },
            nodeEnv: {
                name: "NODE_ENV",
                description: "Runtime environment mode",
                default: "production",
                options: "production, development"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "Verbose debug logging to the console",
                default: "no",
                options: "yes, no"
            }
        }
    },

    cookiesSetup: {
        title: "Cookies Setup",
        subtitle:
            "Fix \"Sign in to confirm you're not a bot\" on cloud hosting. Recommended: the built-in **`!login`** command.",
        why: {
            title: "Why do I need this?",
            description:
                "If you host Rawon on providers like OVHcloud, AWS, GCP, Azure, or other cloud/VPS hosts, you may see:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "The platform often blocks requests from data-center IPs. Authenticating with a **Google account** lets Rawon obtain valid cookies and bypass that restriction."
        },
        loginMethod: {
            title: "Recommended: `!login` command",
            description:
                "The easiest way to set up cookies is the built-in **`!login`** flow (real browser via Puppeteer):",
            benefits: [
                "✅ Opens a real browser for Google login",
                "✅ Exports cookies and saves them automatically",
                "✅ Closes the browser after login — no stray background browser",
                "✅ Persists across restarts (Docker volume or `cache/` folder)"
            ]
        },
        commandUsage: {
            title: "Command usage"
        },
        quickStart: {
            title: "Quick start",
            steps: [
                "Run `!login start` in Discord",
                "Open the **DevTools URL** the bot sends in your local browser",
                "Complete Google login in the **remote** browser session",
                "Sign in with a **throwaway Google account** (not your main account)",
                "When login finishes, the bot saves cookies and closes the browser",
                "Done — subsequent requests use the saved session"
            ]
        },
        staleCookies: {
            title: "If bot checks happen again",
            description: "Cookies can go stale when the provider rotates them. Then:",
            steps: [
                "Run `!login logout` to clear old cookies and profile data",
                "Run `!login start` and sign in again for a fresh session"
            ]
        },
        prerequisites: {
            title: "Prerequisites",
            items: [
                "A **secondary / throwaway Google account** (do **not** use your main account)",
                "**Non-Docker:** Chrome or Chromium installed on the host",
                "**Docker:** Chromium is included; map `DEVTOOLS_PORT` if you connect to `!login` remotely (see [Configuration](/docs/configuration))"
            ]
        },
        docker: {
            title: "Docker",
            persistence:
                "Cookie and profile data persist in the **`rawon:/app/cache`** named volume across container restarts.",
            chromium: "The image ships with Chromium, so **`!login start`** works without extra setup on the image side."
        },
        envVars: {
            title: "Environment variables (`dev.env`)",
            intro: "Optional tuning (see `dev.env.example`):",
            dockerComposeHint:
                "For Docker, ensure `ports` in `docker-compose.yaml` expose the DevTools port, e.g.:"
        },
        duration: {
            title: "How long do cookies last?",
            description:
                "They can become stale over time because providers rotate sessions. They usually stay valid while:",
            conditions: [
                "You do not log out in a way that invalidates the session",
                "You do not change the account password",
                "You do not revoke the session in account security settings",
                "The provider does not flag suspicious activity"
            ],
            footer: "When cookies expire, run `!login logout` then `!login start` again."
        },
        troubleshooting: {
            title: "Troubleshooting",
            stillErrors: {
                title: "Still seeing \"Sign in to confirm you're not a bot\"?",
                steps: [
                    "Use `!login status` to inspect login and cookie state",
                    "Run `!login logout` then `!login start` to mint a fresh session"
                ]
            },
            browserWontStart: {
                title: "Browser will not start?",
                steps: [
                    "Check `!login status` for error details",
                    "On bare metal, install Chrome/Chromium or set `CHROMIUM_PATH` in `dev.env`",
                    "On Docker, Chromium should work out of the box with the official image"
                ]
            },
            accountSuspended: {
                title: "Account suspended?",
                steps: [
                    "Create a new throwaway Google account",
                    "Run `!login logout` to wipe the old session",
                    "Run `!login start` and sign in with the new account"
                ]
            }
        },
        manualAlternative: {
            title: "Alternative: manual cookie file",
            description:
                "You may place a **Netscape-format** cookie file at the path below. The bot will use it if present; **`!login` is still recommended** for a simpler workflow.",
            pathLabel: "Path"
        },
        security: {
            title: "Security notes",
            warningLabel: "WARNING",
            warnings: [
                "Use a **throwaway** Google account — **not** your primary account",
                "The DevTools URL grants access to the remote browser session — **do not share it publicly**",
                "Cookie files contain **sensitive** authentication data"
            ]
        }
    },

    disclaimers: {
        title: "Disclaimers",
        subtitle: "Please read carefully before using this bot.",
        warningBanner: "Important legal information",
        copyright: {
            title: "Copyright, DMCA, and Intellectual Properties",
            items: [
                "**Ownership:** Any intellectual properties used, played, or displayed by the bot are **not owned by us**, the maintainers, or any contributors. This includes, but is not limited to, audio, video, and image files used in the bot's commands.",
                "**Hosting Provider Policies:** Some hosting providers prohibit hosting or distributing DMCA-protected content. This includes Discord music bots that play copyrighted music/video.\n- **Deploy to such platforms at your own risk**",
                "**User Responsibility:** You are responsible for how you use this bot and what content is played through it."
            ]
        },
        code: {
            title: "Code modifications",
            items: [
                "**License:** This project is licensed under [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)](https://creativecommons.org/licenses/by-nc-nd/4.0/). The full legal text is in the repository [`LICENSE`](https://github.com/stegripe/rawon/blob/main/LICENSE) file.",
                "**No warranty:** As stated in the license, we are **not responsible** for any damages or losses resulting from use of this code. Follow the license terms for attribution, non-commercial use, and restrictions on sharing adapted material.",
                "**Attribution:** Never claim this project as your own original work. Always provide proper attribution to the original project."
            ]
        },
        licenseFooterPrefix: "For full license text, see the repository",
        licenseLinkLabel: "LICENSE (CC BY-NC-ND 4.0)"
    },

    permissionCalculator: {
        title: "Permission Calculator",
        clientId: "Client ID",
        scope: "Scope",
        redirectUri: "Redirect URI",
        permissions: "Permissions",
        permissionsNote:
            "Colored means that the OAuth user needs to enable 2FA on their account if the server requires 2FA",
        general: "General",
        voice: "Voice",
        text: "Text",
        result: "Result",
        resultNote: "This is the link you can use to add the bot to your server"
    },

    common: {
        back: "Back",
        copy: "Copy",
        default: "Default",
        required: "Required",
        optional: "Optional",
        example: "Example",
        learnMore: "Learn More",

        language: "Language",
        tip: "Tip",
        warning: "Warning",
        note: "Note"
    }
};

export type Translations = typeof en;
