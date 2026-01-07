import { useLocale } from "@/contexts/LocaleContext";
import { renderWithCode } from "@/components/InlineCode";
import { ArrowBackRounded, CheckCircleOutline } from "@mui/icons-material";
import { Button, Container, IconButton, Typography } from "@mui/material";
import Link from "next/link";
import { CopyBlock, dracula } from "react-code-blocks";

export default function GettingStartedPage() {
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
                                {t.gettingStarted.title}
                            </Typography>
                            <Typography className="font-sans text-sm text-fourth">
                                {renderWithCode(t.gettingStarted.subtitle)}
                            </Typography>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 rounded-lg border-1 border-solid border-third p-4">
                        <Typography className="font-sans text-xl font-semibold">
                            {t.gettingStarted.features.title}
                        </Typography>
                        <div className="grid gap-2 md:grid-cols-2">
                            {t.gettingStarted.features.items.map(
                                (feature, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-2"
                                    >
                                        <CheckCircleOutline className="mt-0.5 text-lg text-secondary" />
                                        <Typography className="font-sans text-base">
                                            {feature}
                                        </Typography>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-xl font-semibold">
                            {t.gettingStarted.requirements.title}
                        </Typography>
                        <ul className="m-0 flex list-disc flex-col gap-1 pl-5">
                            <li>
                                <Typography className="font-sans">
                                    {renderWithCode(t.gettingStarted.requirements.nodeVersion)}
                                </Typography>
                            </li>
                            <li>
                                <Typography className="font-sans">
                                    {renderWithCode(
                                        t.gettingStarted.requirements
                                            .discordToken
                                    )}
                                </Typography>
                            </li>
                            <li>
                                <Typography className="font-sans">
                                    {renderWithCode(t.gettingStarted.requirements.optional)}
                                </Typography>
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-xl font-semibold">
                            {t.gettingStarted.standardSetup.title}
                        </Typography>
                        <ol className="m-0 flex list-decimal flex-col gap-2 pl-5">
                            {t.gettingStarted.standardSetup.steps.map(
                                (step, index) => (
                                    <li key={index}>
                                        <Typography className="font-sans">
                                            {renderWithCode(step)}
                                        </Typography>
                                    </li>
                                )
                            )}
                        </ol>
                        <Typography className="font-sans text-sm">
                            {renderWithCode(t.gettingStarted.standardSetup.requestChannel)}
                        </Typography>
                        <CopyBlock
                            language="bash"
                            text={`<prefix>requestchannel <#channel>
# Example: !requestchannel #music-requests`}
                            theme={dracula}
                            showLineNumbers={false}
                            codeBlock
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-xl font-semibold">
                            {t.gettingStarted.dockerSetup.title}
                        </Typography>

                        <Typography className="font-sans text-lg font-medium">
                            {t.gettingStarted.dockerSetup.composeTitle}
                        </Typography>
                        <ol className="m-0 flex list-decimal flex-col gap-2 pl-5">
                            {t.gettingStarted.dockerSetup.composeSteps.map(
                                (step, index) => (
                                    <li key={index}>
                                        <Typography className="font-sans">
                                            {renderWithCode(step)}
                                        </Typography>
                                    </li>
                                )
                            )}
                        </ol>
                        <CopyBlock
                            language="yaml"
                            text={`services:
  rawon:
    image: ghcr.io/stegripe/rawon:latest
    container_name: rawon-bot
    restart: unless-stopped
    env_file: .env
    volumes:
      - rawon:/app/cache

volumes:
  rawon:`}
                            theme={dracula}
                            showLineNumbers
                            codeBlock
                        />

                        <Typography className="font-sans text-lg font-medium">
                            {t.gettingStarted.dockerSetup.runTitle}
                        </Typography>
                        <CopyBlock
                            language="bash"
                            text={`docker run -d \\
  --name rawon-bot \\
  --env-file .env \\
  -v rawon:/app/cache \\
  --restart unless-stopped \\
  ghcr.io/stegripe/rawon:latest`}
                            theme={dracula}
                            showLineNumbers={false}
                            codeBlock
                        />

                        <div className="mt-4 rounded-lg border-1 border-solid border-fourth bg-primary p-3">
                            <Typography className="font-sans font-medium">
                                {t.gettingStarted.dockerSetup.volumeInfo.title}
                            </Typography>
                            <Typography className="font-sans text-sm">
                                {renderWithCode(
                                    t.gettingStarted.dockerSetup.volumeInfo
                                        .description
                                )}
                            </Typography>
                            <ul className="m-0 mt-2 list-disc pl-5">
                                {t.gettingStarted.dockerSetup.volumeInfo.items.map(
                                    (item, index) => (
                                        <li key={index}>
                                            <Typography className="font-sans text-sm">
                                                {renderWithCode(item)}
                                            </Typography>
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 rounded-lg border-1 border-solid border-secondary bg-red-50 p-4">
                        <Typography className="font-sans text-xl font-semibold">
                            {t.gettingStarted.cookiesQuickStart.title}
                        </Typography>
                        <Typography className="font-sans">
                            {renderWithCode(t.gettingStarted.cookiesQuickStart.description)}
                        </Typography>
                        <ol className="m-0 flex list-decimal flex-col gap-2 pl-5">
                            {t.gettingStarted.cookiesQuickStart.steps.map(
                                (step, index) => (
                                    <li key={index}>
                                        <Typography className="font-sans">
                                            {renderWithCode(step)}
                                        </Typography>
                                    </li>
                                )
                            )}
                        </ol>
                        <div className="rounded-lg bg-green-100 p-3">
                            <Typography className="font-sans text-sm">
                                {renderWithCode(t.gettingStarted.cookiesQuickStart.tip)}
                            </Typography>
                        </div>
                        <Link href="/docs/cookies-setup">
                            <Button
                                variant="outlined"
                                className="w-fit rounded-lg border-secondary font-sans capitalize text-secondary"
                            >
                                {t.nav.cookiesSetup}
                            </Button>
                        </Link>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-xl font-semibold">
                            {t.common.learnMore}
                        </Typography>
                        <div className="flex flex-wrap gap-2">
                            <Link href="/docs/configuration">
                                <Button
                                    variant="outlined"
                                    className="rounded-lg border-third font-sans capitalize text-third"
                                >
                                    {t.nav.configuration}
                                </Button>
                            </Link>
                            <Link href="/docs/cookies-setup">
                                <Button
                                    variant="outlined"
                                    className="rounded-lg border-third font-sans capitalize text-third"
                                >
                                    {t.nav.cookiesSetup}
                                </Button>
                            </Link>
                            <Link href="/docs/disclaimers">
                                <Button
                                    variant="outlined"
                                    className="rounded-lg border-third font-sans capitalize text-third"
                                >
                                    {t.nav.disclaimers}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </Container>
        </>
    );
}
