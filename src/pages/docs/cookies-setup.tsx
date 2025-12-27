import { useLocale } from "@/contexts/LocaleContext";
import { ArrowBackRounded, WarningAmber } from "@mui/icons-material";
import { Container, IconButton, Typography } from "@mui/material";
import Link from "next/link";
import { CopyBlock, dracula } from "react-code-blocks";

export default function CookiesSetupPage() {
    const { t } = useLocale();

    return (
        <>
            <Container
                fixed
                className="relative flex min-h-[calc(100vh-80px)] w-full px-5 py-3 pb-10 pt-0 text-third"
            >
                <div className="flex w-full flex-col gap-6">
                    {/* Header */}
                    <div className="flex w-full items-center gap-3">
                        <Link href="/" className="text-inherit no-underline">
                            <IconButton className="p-0">
                                <ArrowBackRounded className="text-3xl text-third" />
                            </IconButton>
                        </Link>
                        <div>
                            <Typography className="font-sans text-2xl font-medium">
                                {t.cookiesSetup.title}
                            </Typography>
                            <Typography className="font-sans text-sm text-fourth">
                                {t.cookiesSetup.subtitle}
                            </Typography>
                        </div>
                    </div>

                    {/* Why do I need this? */}
                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-xl font-semibold">
                            {t.cookiesSetup.why.title}
                        </Typography>
                        <Typography className="font-sans">
                            {t.cookiesSetup.why.description}
                        </Typography>
                        <div className="rounded-lg bg-third p-3">
                            <Typography className="font-mono text-sm text-white">
                                &quot;{t.cookiesSetup.why.error}&quot;
                            </Typography>
                        </div>
                        <Typography className="font-sans">
                            {t.cookiesSetup.why.explanation}
                        </Typography>
                    </div>

                    {/* Quick Method - Cookies Command */}
                    <div className="flex flex-col gap-4 rounded-lg border-2 border-solid border-green-500 bg-green-50 p-4">
                        <Typography className="font-sans text-xl font-semibold text-green-700">
                            {t.cookiesSetup.quickMethod.title}
                        </Typography>
                        <Typography className="font-sans">
                            {t.cookiesSetup.quickMethod.description}
                        </Typography>

                        {/* Benefits */}
                        <div className="flex flex-col gap-1">
                            {t.cookiesSetup.quickMethod.benefits.map(
                                (benefit, index) => (
                                    <Typography
                                        key={index}
                                        className="font-sans text-sm"
                                    >
                                        {benefit}
                                    </Typography>
                                )
                            )}
                        </div>

                        {/* Commands */}
                        <div className="flex flex-col gap-2">
                            <Typography className="font-sans font-medium">
                                {t.cookiesSetup.quickMethod.commands.title}
                            </Typography>
                            <CopyBlock
                                language="bash"
                                text={`!cookies add <number>    # Add a cookie (attach cookies.txt file)
!cookies remove <number> # Remove a specific cookie
!cookies remove all      # Remove all cookies
!cookies list            # Show all cookies and their status
!cookies reset           # Reset failed status to retry all cookies`}
                                theme={dracula}
                                showLineNumbers={false}
                                codeBlock
                            />
                        </div>

                        {/* Quick Start */}
                        <div className="flex flex-col gap-2">
                            <Typography className="font-sans font-medium">
                                {t.cookiesSetup.quickMethod.quickStart.title}
                            </Typography>
                            <ol className="m-0 list-decimal pl-5">
                                {t.cookiesSetup.quickMethod.quickStart.steps.map(
                                    (step, index) => (
                                        <li key={index}>
                                            <Typography className="font-sans text-sm">
                                                {step}
                                            </Typography>
                                        </li>
                                    )
                                )}
                            </ol>
                        </div>

                        {/* Multi-Cookie Tip */}
                        <div className="rounded-lg bg-green-100 p-3">
                            <Typography className="font-sans font-medium text-green-800">
                                {t.cookiesSetup.quickMethod.multiCookie.title}
                            </Typography>
                            <Typography className="font-sans text-sm text-green-700">
                                {
                                    t.cookiesSetup.quickMethod.multiCookie
                                        .description
                                }
                            </Typography>
                            <CopyBlock
                                language="bash"
                                text={`!cookies add 1  # (attach first cookies.txt)
!cookies add 2  # (attach second cookies.txt from another account)
!cookies add 3  # (attach third cookies.txt)`}
                                theme={dracula}
                                showLineNumbers={false}
                                codeBlock
                            />
                        </div>
                    </div>

                    {/* Prerequisites */}
                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-xl font-semibold">
                            {t.cookiesSetup.prerequisites.title}
                        </Typography>
                        <ul className="m-0 flex list-disc flex-col gap-2 pl-5">
                            {t.cookiesSetup.prerequisites.items.map(
                                (item, index) => (
                                    <li key={index}>
                                        <Typography className="font-sans">
                                            {item}
                                        </Typography>
                                    </li>
                                )
                            )}
                        </ul>
                    </div>

                    {/* Step by Step Guide */}
                    <div className="flex flex-col gap-4">
                        <Typography className="font-sans text-xl font-semibold">
                            {t.cookiesSetup.steps.title}
                        </Typography>

                        {/* Step 1 */}
                        <div className="rounded-lg border-1 border-solid border-third p-4">
                            <Typography className="font-sans text-lg font-medium">
                                {t.cookiesSetup.steps.createAccount.title}
                            </Typography>
                            <ol className="m-0 mt-2 list-decimal pl-5">
                                {t.cookiesSetup.steps.createAccount.steps.map(
                                    (step, index) => (
                                        <li key={index}>
                                            <Typography className="font-sans text-sm">
                                                {step}
                                            </Typography>
                                        </li>
                                    )
                                )}
                            </ol>
                        </div>

                        {/* Step 2 */}
                        <div className="rounded-lg border-1 border-solid border-third p-4">
                            <Typography className="font-sans text-lg font-medium">
                                {t.cookiesSetup.steps.login.title}
                            </Typography>
                            <ol className="m-0 mt-2 list-decimal pl-5">
                                {t.cookiesSetup.steps.login.steps.map(
                                    (step, index) => (
                                        <li key={index}>
                                            <Typography className="font-sans text-sm">
                                                {step}
                                            </Typography>
                                        </li>
                                    )
                                )}
                            </ol>
                        </div>

                        {/* Step 3 */}
                        <div className="rounded-lg border-1 border-solid border-third p-4">
                            <Typography className="font-sans text-lg font-medium">
                                {t.cookiesSetup.steps.extension.title}
                            </Typography>
                            <ul className="m-0 mt-2 list-disc pl-5">
                                <li>
                                    <Typography className="font-sans text-sm">
                                        {t.cookiesSetup.steps.extension.chrome}
                                    </Typography>
                                </li>
                                <li>
                                    <Typography className="font-sans text-sm">
                                        {t.cookiesSetup.steps.extension.firefox}
                                    </Typography>
                                </li>
                            </ul>
                        </div>

                        {/* Step 4 */}
                        <div className="rounded-lg border-1 border-solid border-third p-4">
                            <Typography className="font-sans text-lg font-medium">
                                {t.cookiesSetup.steps.exportCookies.title}
                            </Typography>
                            <ol className="m-0 mt-2 list-decimal pl-5">
                                {t.cookiesSetup.steps.exportCookies.steps.map(
                                    (step, index) => (
                                        <li key={index}>
                                            <Typography className="font-sans text-sm">
                                                {step}
                                            </Typography>
                                        </li>
                                    )
                                )}
                            </ol>
                        </div>

                        {/* Step 5 */}
                        <div className="rounded-lg border-1 border-solid border-third p-4">
                            <Typography className="font-sans text-lg font-medium">
                                {t.cookiesSetup.steps.upload.title}
                            </Typography>
                            <ol className="m-0 mt-2 list-decimal pl-5">
                                {t.cookiesSetup.steps.upload.steps.map(
                                    (step, index) => (
                                        <li key={index}>
                                            <Typography className="font-sans text-sm">
                                                {step}
                                            </Typography>
                                        </li>
                                    )
                                )}
                            </ol>
                        </div>
                    </div>

                    {/* Troubleshooting */}
                    <div className="flex flex-col gap-4">
                        <Typography className="font-sans text-xl font-semibold">
                            {t.cookiesSetup.troubleshooting.title}
                        </Typography>

                        <div className="rounded-lg border-1 border-solid border-fourth bg-yellow-50 p-4">
                            <Typography className="font-sans font-medium">
                                {
                                    t.cookiesSetup.troubleshooting
                                        .stillGettingErrors.title
                                }
                            </Typography>
                            <ul className="m-0 mt-2 list-disc pl-5">
                                {t.cookiesSetup.troubleshooting.stillGettingErrors.steps.map(
                                    (step, index) => (
                                        <li key={index}>
                                            <Typography className="font-sans text-sm">
                                                {step}
                                            </Typography>
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>

                        <div className="rounded-lg border-1 border-solid border-fourth bg-yellow-50 p-4">
                            <Typography className="font-sans font-medium">
                                {
                                    t.cookiesSetup.troubleshooting
                                        .allCookiesFailed.title
                                }
                            </Typography>
                            <ul className="m-0 mt-2 list-disc pl-5">
                                {t.cookiesSetup.troubleshooting.allCookiesFailed.steps.map(
                                    (step, index) => (
                                        <li key={index}>
                                            <Typography className="font-sans text-sm">
                                                {step}
                                            </Typography>
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>

                        <div className="rounded-lg border-1 border-solid border-fourth bg-yellow-50 p-4">
                            <Typography className="font-sans font-medium">
                                {
                                    t.cookiesSetup.troubleshooting
                                        .accountSuspended.title
                                }
                            </Typography>
                            <ul className="m-0 mt-2 list-disc pl-5">
                                {t.cookiesSetup.troubleshooting.accountSuspended.steps.map(
                                    (step, index) => (
                                        <li key={index}>
                                            <Typography className="font-sans text-sm">
                                                {step}
                                            </Typography>
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* How Long Do Cookies Last? */}
                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-xl font-semibold">
                            {t.cookiesSetup.duration.title}
                        </Typography>
                        <Typography className="font-sans">
                            {t.cookiesSetup.duration.description}
                        </Typography>
                        <ul className="m-0 list-none pl-0">
                            {t.cookiesSetup.duration.conditions.map(
                                (condition, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center gap-2"
                                    >
                                        <span className="text-green-600">✅</span>
                                        <Typography className="font-sans text-sm">
                                            {condition}
                                        </Typography>
                                    </li>
                                )
                            )}
                        </ul>
                        <Typography className="font-sans text-sm text-fourth">
                            {t.cookiesSetup.duration.tips}
                        </Typography>
                    </div>

                    {/* Security Notes */}
                    <div className="flex flex-col gap-3">
                        <Typography className="font-sans text-xl font-semibold">
                            {t.cookiesSetup.security.title}
                        </Typography>
                        <div className="rounded-lg border-1 border-solid border-secondary bg-red-50 p-4">
                            <div className="flex items-center gap-2">
                                <WarningAmber className="text-secondary" />
                                <Typography className="font-sans font-semibold text-secondary">
                                    WARNING
                                </Typography>
                            </div>
                            <ul className="m-0 mt-2 list-disc pl-5">
                                {t.cookiesSetup.security.warnings.map(
                                    (warning, index) => (
                                        <li key={index}>
                                            <Typography className="font-sans text-sm">
                                                {warning}
                                            </Typography>
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </Container>
        </>
    );
}
