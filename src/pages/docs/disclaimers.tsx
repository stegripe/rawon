import { useLocale } from "@/contexts/LocaleContext";
import { ArrowBackRounded, WarningAmber } from "@mui/icons-material";
import { Container, IconButton, Typography } from "@mui/material";
import Link from "next/link";

export default function DisclaimersPage() {
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
                                {t.disclaimers.title}
                            </Typography>
                            <Typography className="font-sans text-sm text-fourth">
                                {t.disclaimers.subtitle}
                            </Typography>
                        </div>
                    </div>

                    {/* Warning Banner */}
                    <div className="flex items-center gap-3 rounded-lg border-1 border-solid border-secondary bg-red-50 p-4">
                        <WarningAmber className="text-3xl text-secondary" />
                        <Typography className="font-sans text-lg font-medium text-secondary">
                            {t.disclaimers.subtitle}
                        </Typography>
                    </div>

                    {/* Copyright Section */}
                    <div className="flex flex-col gap-4">
                        <Typography className="font-sans text-xl font-semibold">
                            {t.disclaimers.copyright.title}
                        </Typography>
                        <div className="flex flex-col gap-3">
                            {t.disclaimers.copyright.items.map((item, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg border-1 border-solid border-third p-4"
                                >
                                    <Typography className="font-sans">
                                        <span className="font-semibold">
                                            {index + 1}.
                                        </span>{" "}
                                        {item}
                                    </Typography>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Code Modifications Section */}
                    <div className="flex flex-col gap-4">
                        <Typography className="font-sans text-xl font-semibold">
                            {t.disclaimers.code.title}
                        </Typography>
                        <div className="flex flex-col gap-3">
                            {t.disclaimers.code.items.map((item, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg border-1 border-solid border-third p-4"
                                >
                                    <Typography className="font-sans">
                                        <span className="font-semibold">
                                            {index + 1}.
                                        </span>{" "}
                                        {item}
                                    </Typography>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* License Link */}
                    <div className="flex flex-col gap-2">
                        <Typography className="font-sans text-sm text-fourth">
                            For full license details, see:{" "}
                            <Link
                                href="https://github.com/stegripe/rawon/blob/main/LICENSE"
                                passHref
                                legacyBehavior
                            >
                                <a
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-secondary underline"
                                >
                                    AGPL-3.0 License
                                </a>
                            </Link>
                        </Typography>
                    </div>
                </div>
            </Container>
        </>
    );
}
