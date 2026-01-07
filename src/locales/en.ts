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
            "A simple powerful Discord music bot built to fulfill your production desires. Easy to use, with no coding required.",
        invite: "Invite",
        support: "Support"
    },

    gettingStarted: {
        title: "Getting Started",
        subtitle:
            "Get Rawon up and running in minutes with our step-by-step guide.",
        features: {
            title: "✨ Features",
            items: [
                "🎮 Interaction support (slash commands and buttons)",
                "📺 Request channel feature for seamless music experience",
                "🚀 Production-ready, no coding required",
                "🎵 Basic music commands (play, pause, skip, queue, etc.)",
                "🌍 Multi-language support (12 languages)",
                "🔄 Multi-cookie rotation for uninterrupted playback",
                "⚡ Smart audio pre-caching for smoother playback",
                "🎶 Support for multiple music platforms (video sites, Spotify, SoundCloud)"
            ]
        },
        requirements: {
            title: "📋 Requirements",
            nodeVersion: "**Node.js** version `22.12.0` or higher",
            discordToken:
                "**Discord Bot Token** (get from [Discord Developer Portal](https://discord.com/developers/applications))",
            optional: "**Optional:** Spotify API credentials for Spotify support"
        },
        standardSetup: {
            title: "💻 Standard Setup (Node.js)",
            steps: [
                "Download and install **Node.js** version `22.12.0` or higher",
                "Clone or download this repository",
                "Copy `.env_example` to `.env` and fill in the required values (at minimum: `DISCORD_TOKEN`)",
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
                "Create a `.env` file with your configuration (copy from `.env_example`)",
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
                    "`data.json` for persistent settings (request channels, player states)",
                    "Cached audio files (if audio caching is enabled)",
                    "Cookie files for video platform authentication"
                ]
            }
        },

        cookiesQuickStart: {
            title: "🍪 Quick Start: Cookies Setup",
            description:
                "If you're hosting on cloud providers (AWS, GCP, Azure, Railway, etc.), you may get \"Sign in to confirm you're not a bot\" errors. Fix it easily with the cookies command:",
            steps: [
                "Export cookies from your browser (see [Cookies Setup guide](/docs/cookies-setup))",
                "In Discord, type: `!cookies add 1`",
                "Attach your `cookies.txt` file to the message",
                "Done! The cookie takes effect immediately"
            ],
            tip: "💡 You can add multiple cookies for redundancy. When one fails, Rawon automatically switches to the next one!"
        }
    },

    configuration: {
        title: "Configuration",
        subtitle: "Configure Rawon to fit your needs with these settings.",
        essential: {
            title: "⚡ Essential Settings",
            description:
                "These are the minimum settings required to run the bot. Just fill in your **Discord token** and you're ready to go!",
            discordToken: {
                name: "DISCORD_TOKEN",
                description:
                    "Your Discord bot token from the [Discord Developer Portal](https://discord.com/developers/applications). This is the **only REQUIRED** setting!",
                required: true
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "Main command prefix. Example: `!` means you type `!play` to play music",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "Your main server ID for faster slash command registration. Leave empty for global commands (takes up to 1 hour to update)",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Bot language - choose your preferred language for bot responses",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR"
            },
            spotify: {
                name: "Spotify API",
                description:
                    "For Spotify support, get your credentials from [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) and set `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`"
            }
        },
        optional: {
            title: "🎨 Optional Settings",
            description: "Customize Rawon's behavior and appearance. All these are optional - the bot works fine without them!",
            altPrefix: {
                name: "ALT_PREFIX",
                description:
                    "Alternative prefixes (comma-separated). Use `{mention}` to allow @bot as a prefix. Example: `{mention},r!` allows both `@Rawon play` and `r!play`",
                default: "{mention}"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Bot status activities shown under the bot name (comma-separated). Available placeholders: `{prefix}`, `{userCount}`, `{textChannelCount}`, `{serverCount}`, `{playingCount}`, `{username}`"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "Activity types for each activity above (comma-separated). Must match the number of `ACTIVITIES`",
                options: "PLAYING, WATCHING, LISTENING, COMPETING"
            },
            embedColor: {
                name: "EMBED_COLOR",
                description: "Embed color in hex (without `#`). This color appears on all bot message embeds",
                default: "22C9FF"
            },
            emojis: {
                name: "Emojis",
                description: "Customize success (`YES_EMOJI`) and failure (`NO_EMOJI`) emojis shown in bot responses",
                defaults: "✅ / ❌"
            },
            musicSelection: {
                name: "MUSIC_SELECTION_TYPE",
                description: "How search results are displayed. `message` shows numbered list, `selectmenu` shows dropdown menu",
                options: "message, selectmenu",
                default: "message"
            },
            audioCache: {
                name: "ENABLE_AUDIO_CACHE",
                description:
                    "**[EXPERIMENTAL]** Cache downloaded audio for faster repeated playback. Uses more disk space but speeds up frequently played songs",
                default: "no"
            },
            requestChannelSplash: {
                name: "REQUEST_CHANNEL_SPLASH",
                description: "Custom image URL for the request channel player embed",
                default: "https://cdn.stegripe.org/images/rawon_splash.png"
            }
        },
        developer: {
            title: "🛠️ Developer Settings",
            description: "Advanced settings for bot developers. **Only use if you know what you're doing!**",
            devs: {
                name: "DEVS",
                description: "Bot developer IDs (comma-separated). Developers can access special commands"
            },
            enablePrefix: {
                name: "ENABLE_PREFIX",
                description: "Enable/disable prefix commands (like `!play`). Useful if you only want slash commands",
                default: "yes",
                options: "yes, no"
            },
            enableSlash: {
                name: "ENABLE_SLASH_COMMAND",
                description: "Enable/disable slash commands (like `/play`). Useful if you only want prefix commands",
                default: "yes",
                options: "yes, no"
            },
            debugMode: {
                name: "DEBUG_MODE",
                description: "Enable debug logging for troubleshooting. Shows detailed logs in console",
                default: "no",
                options: "yes, no"
            }
        }
    },

    cookiesSetup: {
        title: "Cookies Setup",
        subtitle:
            "Fix \"Sign in to confirm you're not a bot\" errors on hosting providers. It's easier than you think!",
        why: {
            title: "🤔 Why do I need this?",
            description:
                "If you're hosting Rawon on cloud providers like OVHcloud, AWS, GCP, Azure, Railway, or other hosting services, you might encounter the error:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "This happens because the video platform blocks requests from data center IP addresses. By using cookies from a logged-in account, you can bypass this restriction. Don't worry - it's easy to set up!"
        },
        quickMethod: {
            title: "🚀 Easy Method: Using the Cookies Command (Recommended)",
            description: "The easiest way to manage cookies - no file editing needed!",
            benefits: [
                "✅ Works instantly - no restart needed",
                "✅ Supports multiple cookies with automatic rotation",
                "✅ When one cookie fails, bot automatically uses the next one",
                "✅ Cookies persist after bot restarts"
            ],
            commands: {
                title: "📝 Available Commands"
            },
            quickStart: {
                title: "⚡ Quick Start (3 steps)",
                steps: [
                    "Export cookies from your browser (see guide below)",
                    "In Discord, type: `!cookies add 1` and attach your cookies.txt file",
                    "Done! The cookie is now active"
                ]
            },
            multiCookie: {
                title: "💡 Pro Tip: Add Multiple Cookies",
                description: "Add cookies from different accounts for better reliability:"
            }
        },
        prerequisites: {
            title: "📋 What You Need",
            items: [
                "A secondary/throwaway video platform account (NEVER use your main account!)",
                "A web browser (Chrome, Firefox, or Edge)",
                "A cookies export extension (free from browser store)"
            ]
        },
        steps: {
            title: "📖 How to Export Cookies",
            createAccount: {
                title: "Step 1: Create a Throwaway Account",
                steps: [
                    "Go to the [video platform's account signup page](https://accounts.google.com/signup)",
                    "Create a NEW account specifically for this bot",
                    "⚠️ IMPORTANT: NEVER use your personal/main account!"
                ]
            },
            login: {
                title: "Step 2: Log in to the Video Platform",
                steps: [
                    "Open your browser",
                    "Go to [the video platform website](https://youtube.com)",
                    "Sign in with your throwaway account",
                    "Accept any terms if prompted"
                ]
            },
            extension: {
                title: "Step 3: Install Cookies Export Extension",
                chrome: "For Chrome/Edge: Install [**Get cookies.txt LOCALLY**](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) (recommended) from Chrome Web Store",
                firefox: "For Firefox: Install [**cookies.txt**](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/) from Firefox Add-ons"
            },
            exportCookies: {
                title: "Step 4: Export Cookies",
                steps: [
                    "Make sure you're on [the video platform website](https://youtube.com)",
                    "Click the cookies extension icon in your browser toolbar",
                    "Click **Export** or **Export cookies for this site**",
                    "Save the file as `cookies.txt`"
                ]
            },
            upload: {
                title: "Step 5: Add to Rawon",
                steps: [
                    "Go to any channel where Rawon can see your messages",
                    "Type: `!cookies add 1`",
                    "Attach the cookies.txt file to your message and send",
                    "Rawon will confirm the cookie was added!"
                ]
            }
        },
        troubleshooting: {
            title: "🔧 Troubleshooting",
            stillGettingErrors: {
                title: "Still getting \"Sign in to confirm you're not a bot\" errors?",
                steps: [
                    "Use `!cookies list` to check cookie status",
                    "If a cookie shows **Failed**, try `!cookies reset` to retry",
                    "Add more cookies from different accounts for redundancy"
                ]
            },
            allCookiesFailed: {
                title: "All cookies failed?",
                steps: [
                    "Create new throwaway accounts",
                    "Export fresh cookies",
                    "Add them with `!cookies add <number>`"
                ]
            },
            accountSuspended: {
                title: "Account got suspended?",
                steps: [
                    "This can happen with heavy usage",
                    "Simply create a new throwaway account",
                    "Export new cookies and add them"
                ]
            }
        },
        duration: {
            title: "⏰ How Long Do Cookies Last?",
            description:
                "Good news! Video platform cookies do NOT expire regularly. They stay valid as long as:",
            conditions: [
                "You don't log out from the video platform in your browser",
                "You don't change your account password",
                "You don't revoke the session from account settings",
                "The platform doesn't detect suspicious activity"
            ],
            tips: "In practice, cookies can last months or even years! Just set it up once and forget about it."
        },
        security: {
            title: "🔒 Security Notes",
            warnings: [
                "⚠️ NEVER share your cookies file with anyone",
                "⚠️ Use a throwaway account, NOT your main account",
                "⚠️ The cookies file contains sensitive login data"
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
                "**Ownership:** Any intellectual properties used, played, or displayed by the bot are not owned by us, the maintainers, or any contributors. This includes, but is not limited to, audio, video, and image files used in the bot's commands.",
                "**Hosting Provider Policies:** Some hosting providers prohibit hosting or distributing DMCA-protected content. This includes Discord music bots that play copyrighted music/video. Deploy to such platforms at your own risk.",
                "**User Responsibility:** You are responsible for how you use this bot and what content is played through it."
            ]
        },
        code: {
            title: "Code Modifications",
            items: [
                "**License:** This bot is open source and can be modified and redistributed under the **AGPL-3.0** license.",
                "**No Warranty:** As stated in the license, we are not responsible for any damages or losses resulting from modifying, redistributing, or using this code.",
                "**Attribution:** Never claim this project as your own original work. Always provide proper attribution to the original project."
            ]
        }
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
