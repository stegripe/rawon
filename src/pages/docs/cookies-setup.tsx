import { useLocale } from "@/contexts/LocaleContext";
import { renderWithCode } from "@/components/InlineCode";
import { ArrowBackRounded, WarningAmber } from "@mui/icons-material";
import { Container, IconButton, Typography } from "@mui/material";
import Link from "next/link";
import { CopyBlock, dracula } from "react-code-blocks";

const LOGIN_COMMANDS = `!login start    - Open a browser and start Google login
!login status   - View current login & cookie status
!login logout   - Clear the current login session (wipes all cookies and profile data)`;

const DEV_ENV_SAMPLE = `# Port for Chrome DevTools remote debugging proxy
# Used for the login command to access DevTools from a remote machine/host
# Default: 3000
DEVTOOLS_PORT=""

# Path to Chrome/Chromium executable (auto-detected if empty)
CHROMIUM_PATH=""`;

const DOCKER_PORTS_YAML = `ports:
  - "\${DEVTOOLS_PORT:-3000}:\${DEVTOOLS_PORT:-3000}"`;

const MANUAL_COOKIE_PATH = `cache/cookies.txt`;

export default function CookiesSetupPage() {
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
                                {renderWithCode(t.cookiesSetup.title)}
                            </Typography>
                            <Typography className="font-sans text-sm text-fourth">
                                {renderWithCode(t.cookiesSetup.subtitle)}
                            </Typography>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-xl font-semibold">
                            {renderWithCode(t.cookiesSetup.why.title)}
                        </Typography>
                        <Typography className="font-sans">
                            {renderWithCode(t.cookiesSetup.why.description)}
                        </Typography>
                        <div className="rounded-lg bg-third p-3">
                            <Typography className="font-mono text-sm text-white">
                                &quot;{t.cookiesSetup.why.error}&quot;
                            </Typography>
                        </div>
                        <Typography className="font-sans">
                            {renderWithCode(t.cookiesSetup.why.explanation)}
                        </Typography>
                    </div>

                    <div className="flex flex-col gap-4 rounded-lg border-2 border-solid border-green-500 bg-green-50 p-4">
                        <Typography className="font-sans text-xl font-semibold text-green-700">
                            {renderWithCode(t.cookiesSetup.loginMethod.title)}
                        </Typography>
                        <Typography className="font-sans">
                            {renderWithCode(t.cookiesSetup.loginMethod.description)}
                        </Typography>
                        <div className="flex flex-col gap-1">
                            {t.cookiesSetup.loginMethod.benefits.map((line, index) => (
                                <Typography key={index} className="font-sans text-sm">
                                    {renderWithCode(line)}
                                </Typography>
                            ))}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Typography className="font-sans font-medium">
                                {renderWithCode(t.cookiesSetup.commandUsage.title)}
                            </Typography>
                            <CopyBlock
                                language="bash"
                                text={LOGIN_COMMANDS}
                                theme={dracula}
                                showLineNumbers={false}
                                codeBlock
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-xl font-semibold">
                            {renderWithCode(t.cookiesSetup.quickStart.title)}
                        </Typography>
                        <ol className="m-0 flex list-decimal flex-col gap-2 pl-5">
                            {t.cookiesSetup.quickStart.steps.map((step, index) => (
                                <li key={index}>
                                    <Typography className="font-sans text-sm">
                                        {renderWithCode(step)}
                                    </Typography>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="flex flex-col gap-3 rounded-lg border-1 border-solid border-fourth bg-primary p-4">
                        <Typography className="font-sans text-xl font-semibold">
                            {renderWithCode(t.cookiesSetup.staleCookies.title)}
                        </Typography>
                        <Typography className="font-sans text-sm">
                            {renderWithCode(t.cookiesSetup.staleCookies.description)}
                        </Typography>
                        <ol className="m-0 flex list-decimal flex-col gap-2 pl-5">
                            {t.cookiesSetup.staleCookies.steps.map((step, index) => (
                                <li key={index}>
                                    <Typography className="font-sans text-sm">
                                        {renderWithCode(step)}
                                    </Typography>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-xl font-semibold">
                            {renderWithCode(t.cookiesSetup.prerequisites.title)}
                        </Typography>
                        <ul className="m-0 flex list-disc flex-col gap-2 pl-5">
                            {t.cookiesSetup.prerequisites.items.map((item, index) => (
                                <li key={index}>
                                    <Typography className="font-sans">
                                        {renderWithCode(item)}
                                    </Typography>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-xl font-semibold">
                            {renderWithCode(t.cookiesSetup.docker.title)}
                        </Typography>
                        <Typography className="font-sans">
                            {renderWithCode(t.cookiesSetup.docker.persistence)}
                        </Typography>
                        <Typography className="font-sans">
                            {renderWithCode(t.cookiesSetup.docker.chromium)}
                        </Typography>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-xl font-semibold">
                            {renderWithCode(t.cookiesSetup.envVars.title)}
                        </Typography>
                        <Typography className="font-sans text-sm">
                            {renderWithCode(t.cookiesSetup.envVars.intro)}
                        </Typography>
                        <CopyBlock
                            language="bash"
                            text={DEV_ENV_SAMPLE}
                            theme={dracula}
                            showLineNumbers={false}
                            codeBlock
                        />
                        <Typography className="font-sans text-sm">
                            {renderWithCode(t.cookiesSetup.envVars.dockerComposeHint)}
                        </Typography>
                        <CopyBlock
                            language="yaml"
                            text={DOCKER_PORTS_YAML}
                            theme={dracula}
                            showLineNumbers={false}
                            codeBlock
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-xl font-semibold">
                            {renderWithCode(t.cookiesSetup.duration.title)}
                        </Typography>
                        <Typography className="font-sans">
                            {renderWithCode(t.cookiesSetup.duration.description)}
                        </Typography>
                        <ul className="m-0 list-none pl-0">
                            {t.cookiesSetup.duration.conditions.map((condition, index) => (
                                <li
                                    key={index}
                                    className="flex items-center gap-2"
                                >
                                    <span className="text-green-600">✅</span>
                                    <Typography className="font-sans text-sm">
                                        {renderWithCode(condition)}
                                    </Typography>
                                </li>
                            ))}
                        </ul>
                        <Typography className="font-sans text-sm text-fourth">
                            {renderWithCode(t.cookiesSetup.duration.footer)}
                        </Typography>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Typography className="font-sans text-xl font-semibold">
                            {renderWithCode(t.cookiesSetup.troubleshooting.title)}
                        </Typography>

                        <div className="rounded-lg border-1 border-solid border-fourth bg-yellow-50 p-4">
                            <Typography className="font-sans font-medium">
                                {renderWithCode(t.cookiesSetup.troubleshooting.stillErrors.title)}
                            </Typography>
                            <ul className="m-0 mt-2 list-disc pl-5">
                                {t.cookiesSetup.troubleshooting.stillErrors.steps.map(
                                    (step, index) => (
                                        <li key={index}>
                                            <Typography className="font-sans text-sm">
                                                {renderWithCode(step)}
                                            </Typography>
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>

                        <div className="rounded-lg border-1 border-solid border-fourth bg-yellow-50 p-4">
                            <Typography className="font-sans font-medium">
                                {renderWithCode(
                                    t.cookiesSetup.troubleshooting.browserWontStart.title
                                )}
                            </Typography>
                            <ul className="m-0 mt-2 list-disc pl-5">
                                {t.cookiesSetup.troubleshooting.browserWontStart.steps.map(
                                    (step, index) => (
                                        <li key={index}>
                                            <Typography className="font-sans text-sm">
                                                {renderWithCode(step)}
                                            </Typography>
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>

                        <div className="rounded-lg border-1 border-solid border-fourth bg-yellow-50 p-4">
                            <Typography className="font-sans font-medium">
                                {renderWithCode(
                                    t.cookiesSetup.troubleshooting.accountSuspended.title
                                )}
                            </Typography>
                            <ul className="m-0 mt-2 list-disc pl-5">
                                {t.cookiesSetup.troubleshooting.accountSuspended.steps.map(
                                    (step, index) => (
                                        <li key={index}>
                                            <Typography className="font-sans text-sm">
                                                {renderWithCode(step)}
                                            </Typography>
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-xl font-semibold">
                            {renderWithCode(t.cookiesSetup.manualAlternative.title)}
                        </Typography>
                        <Typography className="font-sans">
                            {renderWithCode(t.cookiesSetup.manualAlternative.description)}
                        </Typography>
                        <Typography className="font-sans text-sm font-medium">
                            {t.cookiesSetup.manualAlternative.pathLabel}
                        </Typography>
                        <CopyBlock
                            language="bash"
                            text={MANUAL_COOKIE_PATH}
                            theme={dracula}
                            showLineNumbers={false}
                            codeBlock
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-xl font-semibold">
                            {renderWithCode(t.cookiesSetup.security.title)}
                        </Typography>
                        <div className="rounded-lg border-1 border-solid border-secondary bg-red-50 p-4">
                            <div className="flex items-center gap-2">
                                <WarningAmber className="text-secondary" />
                                <Typography className="font-sans font-semibold text-secondary">
                                    {t.cookiesSetup.security.warningLabel}
                                </Typography>
                            </div>
                            <ul className="m-0 mt-2 list-disc pl-5">
                                {t.cookiesSetup.security.warnings.map((warning, index) => (
                                    <li key={index}>
                                        <Typography className="font-sans text-sm">
                                            {renderWithCode(warning)}
                                        </Typography>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </Container>
        </>
    );
}
