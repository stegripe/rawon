import { useLocale } from "@/contexts/LocaleContext";
import { renderWithCode } from "@/components/InlineCode";
import { ArrowBackRounded } from "@mui/icons-material";
import { Container, IconButton, Typography } from "@mui/material";
import Link from "next/link";
import { CopyBlock, dracula } from "react-code-blocks";

export default function ConfigurationPage() {
    const { t } = useLocale();

    return (
        <>
            <Container
                fixed
                className="relative flex min-h-[calc(100vh-80px)] w-full px-5 py-3 pb-10 pt-0 text-third"
            >
                <div className="flex w-full flex-col gap-6">
                    <div className="flex w-full items-center gap-3">
                        <Link href="/" className="text-inherit no-underline">
                            <IconButton className="p-0">
                                <ArrowBackRounded className="text-3xl text-third" />
                            </IconButton>
                        </Link>
                        <div>
                            <Typography className="font-sans text-2xl font-medium">
                                {t.configuration.title}
                            </Typography>
                            <Typography className="font-sans text-sm text-fourth">
                                {renderWithCode(t.configuration.subtitle)}
                            </Typography>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div>
                            <Typography className="font-sans text-xl font-semibold">
                                {t.configuration.essential.title}
                            </Typography>
                            <Typography className="font-sans text-sm text-fourth">
                                {renderWithCode(t.configuration.essential.description)}
                            </Typography>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="rounded-lg border-1 border-solid border-third p-4">
                                <div className="flex items-center gap-2">
                                    <code className="rounded bg-third px-2 py-1 font-mono text-sm text-white">
                                        {
                                            t.configuration.essential
                                                .discordToken.name
                                        }
                                    </code>
                                    <span className="rounded bg-secondary px-2 py-0.5 text-xs text-white">
                                        {t.common.required}
                                    </span>
                                </div>
                                <Typography className="mt-2 font-sans text-sm">
                                    {renderWithCode(
                                        t.configuration.essential.discordToken
                                            .description
                                    )}
                                </Typography>
                            </div>

                            <div className="rounded-lg border-1 border-solid border-third p-4">
                                <div className="flex items-center gap-2">
                                    <code className="rounded bg-third px-2 py-1 font-mono text-sm text-white">
                                        {
                                            t.configuration.essential.mainPrefix
                                                .name
                                        }
                                    </code>
                                    <span className="rounded bg-fourth px-2 py-0.5 text-xs text-white">
                                        {t.common.default}:{" "}
                                        {
                                            t.configuration.essential.mainPrefix
                                                .default
                                        }
                                    </span>
                                </div>
                                <Typography className="mt-2 font-sans text-sm">
                                    {renderWithCode(
                                        t.configuration.essential.mainPrefix
                                            .description
                                    )}
                                </Typography>
                            </div>

                            <div className="rounded-lg border-1 border-solid border-third p-4">
                                <div className="flex items-center gap-2">
                                    <code className="rounded bg-third px-2 py-1 font-mono text-sm text-white">
                                        {
                                            t.configuration.essential.mainServer
                                                .name
                                        }
                                    </code>
                                    <span className="rounded bg-gray-500 px-2 py-0.5 text-xs text-white">
                                        {t.common.optional}
                                    </span>
                                </div>
                                <Typography className="mt-2 font-sans text-sm">
                                    {renderWithCode(
                                        t.configuration.essential.mainServer
                                            .description
                                    )}
                                </Typography>
                            </div>

                            <div className="rounded-lg border-1 border-solid border-third p-4">
                                <div className="flex items-center gap-2">
                                    <code className="rounded bg-third px-2 py-1 font-mono text-sm text-white">
                                        {t.configuration.essential.locale.name}
                                    </code>
                                    <span className="rounded bg-fourth px-2 py-0.5 text-xs text-white">
                                        {t.common.default}:{" "}
                                        {
                                            t.configuration.essential.locale
                                                .default
                                        }
                                    </span>
                                </div>
                                <Typography className="mt-2 font-sans text-sm">
                                    {renderWithCode(
                                        t.configuration.essential.locale
                                            .description
                                    )}
                                </Typography>
                                <Typography className="mt-1 font-sans text-xs text-fourth">
                                    {t.configuration.essential.locale.options}
                                </Typography>
                            </div>

                            <div className="rounded-lg border-1 border-solid border-third p-4">
                                <div className="flex items-center gap-2">
                                    <code className="rounded bg-third px-2 py-1 font-mono text-sm text-white">
                                        {
                                            t.configuration.essential.spotify
                                                .name
                                        }
                                    </code>
                                    <span className="rounded bg-gray-500 px-2 py-0.5 text-xs text-white">
                                        {t.common.optional}
                                    </span>
                                </div>
                                <Typography className="mt-2 font-sans text-sm">
                                    {renderWithCode(
                                        t.configuration.essential.spotify
                                            .description
                                    )}
                                </Typography>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-lg font-medium">
                            {t.common.example} .env
                        </Typography>
                        <CopyBlock
                            language="bash"
                            text={`# Essential configuration (only DISCORD_TOKEN is required!)
DISCORD_TOKEN="your-discord-bot-token"
MAIN_PREFIX="!"
MAIN_SERVER=""
LOCALE="en-US"

# Spotify (optional - for Spotify links support)
SPOTIFY_CLIENT_ID=""
SPOTIFY_CLIENT_SECRET=""`}
                            theme={dracula}
                            showLineNumbers
                            codeBlock
                        />
                    </div>

                    <div className="flex flex-col gap-4">
                        <div>
                            <Typography className="font-sans text-xl font-semibold">
                                {t.configuration.optional.title}
                            </Typography>
                            <Typography className="font-sans text-sm text-fourth">
                                {renderWithCode(t.configuration.optional.description)}
                            </Typography>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="rounded-lg border-1 border-solid border-third p-4">
                                <div className="flex items-center gap-2">
                                    <code className="rounded bg-third px-2 py-1 font-mono text-sm text-white">
                                        {
                                            t.configuration.optional.altPrefix
                                                .name
                                        }
                                    </code>
                                    <span className="rounded bg-fourth px-2 py-0.5 text-xs text-white">
                                        {t.common.default}:{" "}
                                        {
                                            t.configuration.optional.altPrefix
                                                .default
                                        }
                                    </span>
                                </div>
                                <Typography className="mt-2 font-sans text-sm">
                                    {renderWithCode(
                                        t.configuration.optional.altPrefix
                                            .description
                                    )}
                                </Typography>
                            </div>

                            <div className="rounded-lg border-1 border-solid border-third p-4">
                                <code className="rounded bg-third px-2 py-1 font-mono text-sm text-white">
                                    {t.configuration.optional.activities.name}
                                </code>
                                <Typography className="mt-2 font-sans text-sm">
                                    {renderWithCode(
                                        t.configuration.optional.activities
                                            .description
                                    )}
                                </Typography>
                            </div>

                            <div className="rounded-lg border-1 border-solid border-third p-4">
                                <code className="rounded bg-third px-2 py-1 font-mono text-sm text-white">
                                    {
                                        t.configuration.optional.activityTypes
                                            .name
                                    }
                                </code>
                                <Typography className="mt-2 font-sans text-sm">
                                    {renderWithCode(t.configuration.optional.activityTypes
                                            .description)}
                                </Typography>
                                <Typography className="mt-1 font-sans text-xs text-fourth">
                                    {
                                        t.configuration.optional.activityTypes
                                            .options
                                    }
                                </Typography>
                            </div>

                            <div className="rounded-lg border-1 border-solid border-third p-4">
                                <div className="flex items-center gap-2">
                                    <code className="rounded bg-third px-2 py-1 font-mono text-sm text-white">
                                        {
                                            t.configuration.optional.embedColor
                                                .name
                                        }
                                    </code>
                                    <span className="rounded bg-fourth px-2 py-0.5 text-xs text-white">
                                        {t.common.default}:{" "}
                                        {
                                            t.configuration.optional.embedColor
                                                .default
                                        }
                                    </span>
                                </div>
                                <Typography className="mt-2 font-sans text-sm">
                                    {renderWithCode(
                                        t.configuration.optional.embedColor
                                            .description
                                    )}
                                </Typography>
                            </div>

                            <div className="rounded-lg border-1 border-solid border-third p-4">
                                <div className="flex items-center gap-2">
                                    <code className="rounded bg-third px-2 py-1 font-mono text-sm text-white">
                                        {t.configuration.optional.emojis.name}
                                    </code>
                                    <span className="rounded bg-fourth px-2 py-0.5 text-xs text-white">
                                        {t.common.default}:{" "}
                                        {
                                            t.configuration.optional.emojis
                                                .defaults
                                        }
                                    </span>
                                </div>
                                <Typography className="mt-2 font-sans text-sm">
                                    {renderWithCode(
                                        t.configuration.optional.emojis
                                            .description
                                    )}
                                </Typography>
                            </div>

                            <div className="rounded-lg border-1 border-solid border-third p-4">
                                <div className="flex items-center gap-2">
                                    <code className="rounded bg-third px-2 py-1 font-mono text-sm text-white">
                                        {
                                            t.configuration.optional
                                                .musicSelection.name
                                        }
                                    </code>
                                    <span className="rounded bg-fourth px-2 py-0.5 text-xs text-white">
                                        {t.common.default}:{" "}
                                        {
                                            t.configuration.optional
                                                .musicSelection.default
                                        }
                                    </span>
                                </div>
                                <Typography className="mt-2 font-sans text-sm">
                                    {renderWithCode(
                                        t.configuration.optional.musicSelection
                                            .description
                                    )}
                                </Typography>
                                <Typography className="mt-1 font-sans text-xs text-fourth">
                                    {
                                        t.configuration.optional.musicSelection
                                            .options
                                    }
                                </Typography>
                            </div>

                            <div className="rounded-lg border-1 border-solid border-third p-4">
                                <div className="flex items-center gap-2">
                                    <code className="rounded bg-third px-2 py-1 font-mono text-sm text-white">
                                        {
                                            t.configuration.optional.audioCache
                                                .name
                                        }
                                    </code>
                                    <span className="rounded bg-fourth px-2 py-0.5 text-xs text-white">
                                        {t.common.default}:{" "}
                                        {
                                            t.configuration.optional.audioCache
                                                .default
                                        }
                                    </span>
                                </div>
                                <Typography className="mt-2 font-sans text-sm">
                                    {renderWithCode(
                                        t.configuration.optional.audioCache
                                            .description
                                    )}
                                </Typography>
                            </div>

                            <div className="rounded-lg border-1 border-solid border-third p-4">
                                <code className="rounded bg-third px-2 py-1 font-mono text-sm text-white">
                                    {
                                        t.configuration.optional
                                            .requestChannelSplash.name
                                    }
                                </code>
                                <Typography className="mt-2 font-sans text-sm">
                                    {renderWithCode(
                                        t.configuration.optional
                                            .requestChannelSplash.description
                                    )}
                                </Typography>
                                <Typography className="mt-1 font-sans text-xs text-fourth">
                                    {t.common.default}:{" "}
                                    {
                                        t.configuration.optional
                                            .requestChannelSplash.default
                                    }
                                </Typography>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-lg font-medium">
                            {t.common.example} optional.env
                        </Typography>
                        <CopyBlock
                            language="bash"
                            text={`# Alternative prefixes
ALT_PREFIX="{mention}"

# Bot activities
ACTIVITIES="My default prefix is {prefix}, music with {userCount} users"
ACTIVITY_TYPES="PLAYING, LISTENING"

# Customization
EMBED_COLOR="22C9FF"
YES_EMOJI="✅"
NO_EMOJI="❌"
REQUEST_CHANNEL_SPLASH=""

# Other settings
MUSIC_SELECTION_TYPE="message"
ENABLE_AUDIO_CACHE="no"`}
                            theme={dracula}
                            showLineNumbers
                            codeBlock
                        />
                    </div>

                    <div className="flex flex-col gap-4">
                        <div>
                            <Typography className="font-sans text-xl font-semibold">
                                {t.configuration.developer.title}
                            </Typography>
                            <Typography className="font-sans text-sm text-fourth">
                                {renderWithCode(t.configuration.developer.description)}
                            </Typography>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="rounded-lg border-1 border-solid border-third p-4">
                                <div className="flex items-center gap-2">
                                    <code className="rounded bg-third px-2 py-1 font-mono text-sm text-white">
                                        {t.configuration.developer.devs.name}
                                    </code>
                                    <span className="rounded bg-gray-500 px-2 py-0.5 text-xs text-white">
                                        {t.common.optional}
                                    </span>
                                </div>
                                <Typography className="mt-2 font-sans text-sm">
                                    {renderWithCode(
                                        t.configuration.developer.devs
                                            .description
                                    )}
                                </Typography>
                            </div>

                            <div className="rounded-lg border-1 border-solid border-third p-4">
                                <div className="flex items-center gap-2">
                                    <code className="rounded bg-third px-2 py-1 font-mono text-sm text-white">
                                        {
                                            t.configuration.developer
                                                .enablePrefix.name
                                        }
                                    </code>
                                    <span className="rounded bg-fourth px-2 py-0.5 text-xs text-white">
                                        {t.common.default}:{" "}
                                        {
                                            t.configuration.developer
                                                .enablePrefix.default
                                        }
                                    </span>
                                </div>
                                <Typography className="mt-2 font-sans text-sm">
                                    {renderWithCode(
                                        t.configuration.developer.enablePrefix
                                            .description
                                    )}
                                </Typography>
                                <Typography className="mt-1 font-sans text-xs text-fourth">
                                    {
                                        t.configuration.developer.enablePrefix
                                            .options
                                    }
                                </Typography>
                            </div>

                            <div className="rounded-lg border-1 border-solid border-third p-4">
                                <div className="flex items-center gap-2">
                                    <code className="rounded bg-third px-2 py-1 font-mono text-sm text-white">
                                        {
                                            t.configuration.developer.enableSlash
                                                .name
                                        }
                                    </code>
                                    <span className="rounded bg-fourth px-2 py-0.5 text-xs text-white">
                                        {t.common.default}:{" "}
                                        {
                                            t.configuration.developer.enableSlash
                                                .default
                                        }
                                    </span>
                                </div>
                                <Typography className="mt-2 font-sans text-sm">
                                    {renderWithCode(
                                        t.configuration.developer.enableSlash
                                            .description
                                    )}
                                </Typography>
                                <Typography className="mt-1 font-sans text-xs text-fourth">
                                    {
                                        t.configuration.developer.enableSlash
                                            .options
                                    }
                                </Typography>
                            </div>

                            <div className="rounded-lg border-1 border-solid border-third p-4">
                                <div className="flex items-center gap-2">
                                    <code className="rounded bg-third px-2 py-1 font-mono text-sm text-white">
                                        {
                                            t.configuration.developer.debugMode
                                                .name
                                        }
                                    </code>
                                    <span className="rounded bg-fourth px-2 py-0.5 text-xs text-white">
                                        {t.common.default}:{" "}
                                        {
                                            t.configuration.developer.debugMode
                                                .default
                                        }
                                    </span>
                                </div>
                                <Typography className="mt-2 font-sans text-sm">
                                    {renderWithCode(
                                        t.configuration.developer.debugMode
                                            .description
                                    )}
                                </Typography>
                                <Typography className="mt-1 font-sans text-xs text-fourth">
                                    {
                                        t.configuration.developer.debugMode
                                            .options
                                    }
                                </Typography>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-lg font-medium">
                            {t.common.example} dev.env
                        </Typography>
                        <CopyBlock
                            language="bash"
                            text={`# Developer configuration (for bot developers)
DEVS=""
ENABLE_PREFIX="yes"
ENABLE_SLASH_COMMAND="yes"
NODE_ENV="production"
DEBUG_MODE="no"`}
                            theme={dracula}
                            showLineNumbers
                            codeBlock
                        />
                    </div>
                </div>
            </Container>
        </>
    );
}
