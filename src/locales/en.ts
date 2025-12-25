export const en = {
    // Navigation
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

    // Home page
    home: {
        title: "Rawon",
        description:
            "A simple powerful Discord music bot built to fulfill your production desires.",
        invite: "Invite",
        support: "Support",
        viewDocs: "View Docs"
    },

    // Getting Started page
    gettingStarted: {
        title: "Getting Started",
        subtitle:
            "Get Rawon up and running in minutes with our step-by-step guide.",
        features: {
            title: "Features",
            items: [
                "Interaction support (slash commands and buttons)",
                "Request channel feature for seamless music experience",
                "Production-ready, no coding required",
                "Configurable and easy to use",
                "Basic music commands (play, pause, skip, queue, etc.)",
                "Multi-language support"
            ]
        },
        requirements: {
            title: "Requirements",
            nodeVersion: "Node.js version 22.12.0 or higher",
            discordToken:
                "Discord Bot Token (get from Discord Developer Portal)",
            optional: "Optional: Spotify API credentials for Spotify support"
        },
        standardSetup: {
            title: "Standard Setup (Node.js)",
            steps: [
                "Download and install Node.js version 22.12.0 or higher",
                "Clone or download this repository",
                "Copy .env_example to .env and fill in the required values (at minimum: DISCORD_TOKEN)",
                "Install dependencies: pnpm install",
                "Build the project: pnpm run build",
                "Start the bot: pnpm start"
            ],
            requestChannel:
                "(Optional) After the bot is online, set up a dedicated music channel:"
        },
        dockerSetup: {
            title: "Docker Setup (Recommended)",
            composeTitle: "Using Docker Compose",
            composeSteps: [
                "Create a .env file with your configuration (copy from .env_example)",
                "Create a docker-compose.yaml file (see example below)",
                "Start the bot: docker compose up -d",
                "View logs: docker logs -f rawon-bot"
            ],
            runTitle: "Using Docker Run",
            volumeInfo: {
                title: "Volume Information",
                description: "The /app/cache volume stores:",
                items: [
                    "yt-dlp binary for audio streaming",
                    "data.json for persistent settings (request channels, player states)",
                    "Cached audio files (if audio caching is enabled)"
                ]
            }
        },
        railwaySetup: {
            title: "Railway Deployment",
            description:
                "Railway provides $5 free credits monthly. Your bot will stay online 24/7 as long as usage stays under $5.",
            warning: "IMPORTANT: Read Disclaimers before deploying to Railway."
        }
    },

    // Configuration page
    configuration: {
        title: "Configuration",
        subtitle: "Configure Rawon to fit your needs with these settings.",
        essential: {
            title: "Essential Settings",
            description:
                "These are the minimum settings required to run the bot.",
            discordToken: {
                name: "DISCORD_TOKEN",
                description:
                    "Your Discord bot token from the Discord Developer Portal",
                required: true
            },
            mainPrefix: {
                name: "MAIN_PREFIX",
                description: "Main command prefix",
                default: "!"
            },
            mainServer: {
                name: "MAIN_SERVER",
                description: "Your main server ID for slash command registration",
                required: false
            },
            locale: {
                name: "LOCALE",
                description: "Bot language",
                default: "en-US",
                options:
                    "en-US, es-ES, fr-FR, id-ID, zh-CN, zh-TW, uk-UA, vi-VN, pt-BR, ru-RU, ja-JP, tr-TR"
            },
            spotify: {
                name: "Spotify API",
                description:
                    "For Spotify support, set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET"
            }
        },
        optional: {
            title: "Optional Settings",
            description: "Customize Rawon's behavior and appearance.",
            altPrefix: {
                name: "ALT_PREFIX",
                description:
                    "Alternative prefixes (comma-separated). Use {mention} for @bot mention",
                default: "{mention}"
            },
            activities: {
                name: "ACTIVITIES",
                description:
                    "Bot status activities (comma-separated). Formats: {prefix}, {userCount}, {textChannelCount}, {serverCount}, {playingCount}, {username}"
            },
            activityTypes: {
                name: "ACTIVITY_TYPES",
                description: "Activity types for each activity (comma-separated)",
                options: "PLAYING, WATCHING, LISTENING, COMPETING"
            },
            embedColor: {
                name: "EMBED_COLOR",
                description: "Embed color in hex (without #)",
                default: "22C9FF"
            },
            emojis: {
                name: "Emojis",
                description: "Customize success (YES_EMOJI) and failure (NO_EMOJI) emojis",
                defaults: "✅ / ❌"
            },
            musicSelection: {
                name: "MUSIC_SELECTION_TYPE",
                description: "Music selection style",
                options: "message, selectmenu",
                default: "message"
            },
            audioCache: {
                name: "ENABLE_AUDIO_CACHE",
                description:
                    "[EXPERIMENTAL] Cache downloaded audio for faster repeated playback",
                default: "no"
            }
        }
    },

    // Cookies Setup page
    cookiesSetup: {
        title: "Cookies Setup",
        subtitle:
            "Fix 'Sign in to confirm you're not a bot' errors on hosting providers.",
        why: {
            title: "Why do I need this?",
            description:
                "If you're hosting Rawon on cloud providers like OVHcloud, AWS, GCP, Azure, or other hosting services, you might encounter the error:",
            error: "Sign in to confirm you're not a bot",
            explanation:
                "This happens because the platform blocks requests from data center IP addresses. By using cookies from a logged-in account, you can bypass this restriction."
        },
        prerequisites: {
            title: "Prerequisites",
            items: [
                "A secondary/throwaway account (DO NOT use your main account for security reasons)",
                "A web browser (Chrome, Firefox, or Edge)",
                "A cookies export extension",
                "For non-Docker users: Deno JavaScript runtime (required for yt-dlp signature solving)"
            ]
        },
        steps: {
            title: "Step-by-Step Guide",
            createAccount: {
                title: "Step 1: Create a Throwaway Account",
                steps: [
                    "Go to Account Creation",
                    "Create a new account specifically for this bot",
                    "Important: Do NOT use your personal/main account"
                ]
            },
            login: {
                title: "Step 2: Log in to the Platform",
                steps: [
                    "Open your browser",
                    "Go to the platform (YouTube)",
                    "Sign in with your throwaway account",
                    "Accept any terms if prompted"
                ]
            },
            extension: {
                title: "Step 3: Install Cookies Export Extension",
                chrome: "For Chrome/Edge: Install 'Get cookies.txt LOCALLY' or 'cookies.txt'",
                firefox: "For Firefox: Install 'cookies.txt'"
            },
            exportCookies: {
                title: "Step 4: Export Cookies",
                steps: [
                    "Make sure you're on the platform website",
                    "Click the cookies extension icon in your browser toolbar",
                    "Choose 'Export' or 'Export cookies for this site'",
                    "Save the file as cookies.txt"
                ]
            },
            upload: {
                title: "Step 5: Upload to Your Server",
                steps: [
                    "Create a cache folder in your Rawon directory if it doesn't exist",
                    "Upload the cookies.txt file to the cache folder",
                    "The path should be: ./cache/cookies.txt"
                ]
            },
            configure: {
                title: "Step 6: Configure Environment Variable",
                instruction: "Add this to your .env file:"
            },
            restart: {
                title: "Step 7: Restart Rawon",
                instruction: "Restart your bot to apply the changes."
            }
        },
        docker: {
            title: "Docker Setup",
            description:
                "If you're using Docker, place your cookies.txt file next to your docker-compose.yaml file and add the volume mount."
        },
        duration: {
            title: "How Long Do Cookies Last?",
            description:
                "Good news: Platform cookies do NOT expire on a regular schedule. They will remain valid as long as:",
            conditions: [
                "You don't log out from the platform in your browser",
                "You don't change your account password",
                "You don't revoke the session from account settings",
                "The platform doesn't detect suspicious activity"
            ],
            tips: "In practice, cookies can last months or even years if you follow best practices."
        },
        security: {
            title: "Security Notes",
            warnings: [
                "Never share your cookies file with anyone",
                "Use a throwaway account, NOT your main account",
                "The cookies file contains sensitive authentication data",
                "Add cookies.txt to your .gitignore to prevent accidental commits"
            ]
        }
    },

    // Disclaimers page
    disclaimers: {
        title: "Disclaimers",
        subtitle: "Please read carefully before using this bot.",
        copyright: {
            title: "Copyright, DMCA, and Intellectual Properties",
            items: [
                "Ownership: Any intellectual properties used, played, or displayed by the bot are not owned by us, the maintainers, or any contributors. This includes, but is not limited to, audio, video, and image files used in the bot's commands.",
                "Hosting Provider Policies: Some hosting providers (like Railway) prohibit hosting or distributing DMCA-protected content. This includes Discord music bots that play copyrighted music/video. Deploy to such platforms at your own risk.",
                "User Responsibility: You are responsible for how you use this bot and what content is played through it."
            ]
        },
        code: {
            title: "Code Modifications",
            items: [
                "License: This bot is open source and can be modified and redistributed under the AGPL-3.0 license.",
                "No Warranty: As stated in the license, we are not responsible for any damages or losses resulting from modifying, redistributing, or using this code.",
                "Attribution: Never claim this project as your own original work. Always provide proper attribution to the original project."
            ]
        }
    },

    // Permission Calculator page
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

    // Common
    common: {
        back: "Back",
        copy: "Copy",
        default: "Default",
        required: "Required",
        optional: "Optional",
        example: "Example",
        learnMore: "Learn More",
        deployOnRailway: "Deploy on Railway"
    }
};
