import { useLocale } from "@/contexts/LocaleContext";
import { renderWithCode } from "@/components/InlineCode";
import { ArrowBackRounded } from "@mui/icons-material";
import { Container, IconButton, Typography } from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";
import { CopyBlock, dracula } from "react-code-blocks";

const EXAMPLE_ENV = `# Essential (only DISCORD_TOKEN is required to run)
DISCORD_TOKEN=""
SPOTIFY_CLIENT_ID=""
SPOTIFY_CLIENT_SECRET=""
STEGRIPE_API_LYRICS_TOKEN=""
MAIN_PREFIX="!"
MAIN_SERVER=""
DEVS=""
LOCALE="en-US"
ACTIVITY_TYPES="PLAYING, LISTENING, WATCHING, PLAYING"
ACTIVITIES="My default prefix is {prefix}, music with {userCount} users"`;

const EXAMPLE_DEV_ENV = `# Prefix / slash / sharding
ENABLE_PREFIX="yes"
ENABLE_SLASH_COMMAND="yes"
ENABLE_SHARDING="no"

# Login command (DevTools + Chromium)
DEVTOOLS_PORT=""
CHROMIUM_PATH=""

NODE_ENV="production"
DEBUG_MODE="no"`;

function SettingCard({
    code,
    badge,
    children
}: {
    code: string;
    badge: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="rounded-lg border-1 border-solid border-third p-4">
            <div className="flex items-center gap-2">
                <code className="rounded bg-third px-2 py-1 font-mono text-sm text-white">
                    {code}
                </code>
                {badge}
            </div>
            <div className="mt-2 font-sans text-sm">{children}</div>
        </div>
    );
}

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
                                {renderWithCode(t.configuration.title)}
                            </Typography>
                            <Typography className="font-sans text-sm text-fourth">
                                {renderWithCode(t.configuration.subtitle)}
                            </Typography>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-xl font-semibold">
                            {renderWithCode(t.configuration.overview.title)}
                        </Typography>
                        <Typography className="font-sans text-sm">
                            {renderWithCode(t.configuration.overview.intro)}
                        </Typography>
                        <ul className="m-0 flex list-disc flex-col gap-2 pl-5">
                            {t.configuration.overview.items.map((item, index) => (
                                <li key={index}>
                                    <Typography className="font-sans text-sm">
                                        {renderWithCode(item)}
                                    </Typography>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div>
                            <Typography className="font-sans text-xl font-semibold">
                                {renderWithCode(t.configuration.essential.title)}
                            </Typography>
                            <Typography className="font-sans text-sm text-fourth">
                                {renderWithCode(t.configuration.essential.description)}
                            </Typography>
                        </div>

                        <div className="flex flex-col gap-4">
                            <SettingCard
                                code={t.configuration.essential.discordToken.name}
                                badge={
                                    <span className="rounded bg-secondary px-2 py-0.5 text-xs text-white">
                                        {t.common.required}
                                    </span>
                                }
                            >
                                <Typography component="span">
                                    {renderWithCode(
                                        t.configuration.essential.discordToken.description
                                    )}
                                </Typography>
                            </SettingCard>

                            <SettingCard
                                code={t.configuration.essential.spotify.name}
                                badge={
                                    <span className="rounded bg-gray-500 px-2 py-0.5 text-xs text-white">
                                        {t.common.optional}
                                    </span>
                                }
                            >
                                <Typography component="span">
                                    {renderWithCode(
                                        t.configuration.essential.spotify.description
                                    )}
                                </Typography>
                            </SettingCard>

                            <SettingCard
                                code={t.configuration.essential.stegripeLyrics.name}
                                badge={
                                    <span className="rounded bg-gray-500 px-2 py-0.5 text-xs text-white">
                                        {t.common.optional}
                                    </span>
                                }
                            >
                                <Typography component="span">
                                    {renderWithCode(
                                        t.configuration.essential.stegripeLyrics.description
                                    )}
                                </Typography>
                            </SettingCard>

                            <SettingCard
                                code={t.configuration.essential.mainPrefix.name}
                                badge={
                                    <span className="rounded bg-fourth px-2 py-0.5 text-xs text-white">
                                        {t.common.default}:{" "}
                                        {t.configuration.essential.mainPrefix.default}
                                    </span>
                                }
                            >
                                <Typography component="span">
                                    {renderWithCode(
                                        t.configuration.essential.mainPrefix.description
                                    )}
                                </Typography>
                            </SettingCard>

                            <SettingCard
                                code={t.configuration.essential.mainServer.name}
                                badge={
                                    <span className="rounded bg-gray-500 px-2 py-0.5 text-xs text-white">
                                        {t.common.optional}
                                    </span>
                                }
                            >
                                <Typography component="span">
                                    {renderWithCode(
                                        t.configuration.essential.mainServer.description
                                    )}
                                </Typography>
                            </SettingCard>

                            <SettingCard
                                code={t.configuration.essential.devs.name}
                                badge={
                                    <span className="rounded bg-gray-500 px-2 py-0.5 text-xs text-white">
                                        {t.common.optional}
                                    </span>
                                }
                            >
                                <Typography component="span">
                                    {renderWithCode(
                                        t.configuration.essential.devs.description
                                    )}
                                </Typography>
                            </SettingCard>

                            <SettingCard
                                code={t.configuration.essential.locale.name}
                                badge={
                                    <span className="rounded bg-fourth px-2 py-0.5 text-xs text-white">
                                        {t.common.default}:{" "}
                                        {t.configuration.essential.locale.default}
                                    </span>
                                }
                            >
                                <Typography component="span">
                                    {renderWithCode(
                                        t.configuration.essential.locale.description
                                    )}
                                </Typography>
                                <Typography className="mt-1 font-sans text-xs text-fourth">
                                    {t.configuration.essential.locale.options}
                                </Typography>
                            </SettingCard>

                            <SettingCard
                                code={t.configuration.essential.activityTypes.name}
                                badge={
                                    <span className="rounded bg-fourth px-2 py-0.5 text-xs text-white">
                                        {t.common.default}:{" "}
                                        {t.configuration.essential.activityTypes.default}
                                    </span>
                                }
                            >
                                <Typography component="span">
                                    {renderWithCode(
                                        t.configuration.essential.activityTypes.description
                                    )}
                                </Typography>
                                <Typography className="mt-1 font-sans text-xs text-fourth">
                                    {t.configuration.essential.activityTypes.options}
                                </Typography>
                            </SettingCard>

                            <SettingCard
                                code={t.configuration.essential.activities.name}
                                badge={
                                    <span className="rounded bg-gray-500 px-2 py-0.5 text-xs text-white">
                                        {t.common.optional}
                                    </span>
                                }
                            >
                                <Typography component="span">
                                    {renderWithCode(
                                        t.configuration.essential.activities.description
                                    )}
                                </Typography>
                            </SettingCard>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-lg font-medium">
                            {t.common.example} .env
                        </Typography>
                        <CopyBlock
                            language="bash"
                            text={EXAMPLE_ENV}
                            theme={dracula}
                            showLineNumbers
                            codeBlock
                        />
                    </div>

                    <div className="flex flex-col gap-4">
                        <div>
                            <Typography className="font-sans text-xl font-semibold">
                                {renderWithCode(t.configuration.multiBot.title)}
                            </Typography>
                            <Typography className="font-sans text-sm text-fourth">
                                {renderWithCode(t.configuration.multiBot.description)}
                            </Typography>
                        </div>
                        <Typography className="font-sans text-sm font-medium">
                            {renderWithCode(t.configuration.multiBot.example)}
                        </Typography>
                        <CopyBlock
                            language="bash"
                            text={t.configuration.multiBot.exampleCode}
                            theme={dracula}
                            showLineNumbers={false}
                            codeBlock
                        />
                        <ul className="m-0 flex list-disc flex-col gap-2 pl-5">
                            {t.configuration.multiBot.features.map((line, index) => (
                                <li key={index}>
                                    <Typography className="font-sans text-sm">
                                        {renderWithCode(line)}
                                    </Typography>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div>
                            <Typography className="font-sans text-xl font-semibold">
                                {renderWithCode(t.configuration.developer.title)}
                            </Typography>
                            <Typography className="font-sans text-sm text-fourth">
                                {renderWithCode(t.configuration.developer.description)}
                            </Typography>
                        </div>

                        <div className="flex flex-col gap-4">
                            <SettingCard
                                code={t.configuration.developer.enablePrefix.name}
                                badge={
                                    <span className="rounded bg-fourth px-2 py-0.5 text-xs text-white">
                                        {t.common.default}:{" "}
                                        {t.configuration.developer.enablePrefix.default}
                                    </span>
                                }
                            >
                                <Typography component="span">
                                    {renderWithCode(
                                        t.configuration.developer.enablePrefix.description
                                    )}
                                </Typography>
                                <Typography className="mt-1 font-sans text-xs text-fourth">
                                    {t.configuration.developer.enablePrefix.options}
                                </Typography>
                            </SettingCard>

                            <SettingCard
                                code={t.configuration.developer.enableSlash.name}
                                badge={
                                    <span className="rounded bg-fourth px-2 py-0.5 text-xs text-white">
                                        {t.common.default}:{" "}
                                        {t.configuration.developer.enableSlash.default}
                                    </span>
                                }
                            >
                                <Typography component="span">
                                    {renderWithCode(
                                        t.configuration.developer.enableSlash.description
                                    )}
                                </Typography>
                                <Typography className="mt-1 font-sans text-xs text-fourth">
                                    {t.configuration.developer.enableSlash.options}
                                </Typography>
                            </SettingCard>

                            <SettingCard
                                code={t.configuration.developer.enableSharding.name}
                                badge={
                                    <span className="rounded bg-fourth px-2 py-0.5 text-xs text-white">
                                        {t.common.default}:{" "}
                                        {t.configuration.developer.enableSharding.default}
                                    </span>
                                }
                            >
                                <Typography component="span">
                                    {renderWithCode(
                                        t.configuration.developer.enableSharding.description
                                    )}
                                </Typography>
                                <Typography className="mt-1 font-sans text-xs text-fourth">
                                    {t.configuration.developer.enableSharding.options}
                                </Typography>
                            </SettingCard>

                            <SettingCard
                                code={t.configuration.developer.devtoolsPort.name}
                                badge={
                                    <span className="rounded bg-fourth px-2 py-0.5 text-xs text-white">
                                        {t.common.default}:{" "}
                                        {t.configuration.developer.devtoolsPort.default}
                                    </span>
                                }
                            >
                                <Typography component="span">
                                    {renderWithCode(
                                        t.configuration.developer.devtoolsPort.description
                                    )}
                                </Typography>
                            </SettingCard>

                            <SettingCard
                                code={t.configuration.developer.chromiumPath.name}
                                badge={
                                    <span className="rounded bg-gray-500 px-2 py-0.5 text-xs text-white">
                                        {t.common.optional}
                                    </span>
                                }
                            >
                                <Typography component="span">
                                    {renderWithCode(
                                        t.configuration.developer.chromiumPath.description
                                    )}
                                </Typography>
                            </SettingCard>

                            <SettingCard
                                code={t.configuration.developer.nodeEnv.name}
                                badge={
                                    <span className="rounded bg-fourth px-2 py-0.5 text-xs text-white">
                                        {t.common.default}:{" "}
                                        {t.configuration.developer.nodeEnv.default}
                                    </span>
                                }
                            >
                                <Typography component="span">
                                    {renderWithCode(
                                        t.configuration.developer.nodeEnv.description
                                    )}
                                </Typography>
                                <Typography className="mt-1 font-sans text-xs text-fourth">
                                    {t.configuration.developer.nodeEnv.options}
                                </Typography>
                            </SettingCard>

                            <SettingCard
                                code={t.configuration.developer.debugMode.name}
                                badge={
                                    <span className="rounded bg-fourth px-2 py-0.5 text-xs text-white">
                                        {t.common.default}:{" "}
                                        {t.configuration.developer.debugMode.default}
                                    </span>
                                }
                            >
                                <Typography component="span">
                                    {renderWithCode(
                                        t.configuration.developer.debugMode.description
                                    )}
                                </Typography>
                                <Typography className="mt-1 font-sans text-xs text-fourth">
                                    {t.configuration.developer.debugMode.options}
                                </Typography>
                            </SettingCard>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-lg font-medium">
                            {t.common.example} dev.env
                        </Typography>
                        <CopyBlock
                            language="bash"
                            text={EXAMPLE_DEV_ENV}
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
