import { useLocale } from "@/contexts/LocaleContext";
import { Button, Container, Typography } from "@mui/material";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const INVITE_BOTS = [
    { id: "999162626036740138", name: "Rawon #1" },
    { id: "999162626036740138", name: "Rawon #2" },
    { id: "999162626036740138", name: "Rawon #3" },
    { id: "999162626036740138", name: "Rawon #4" },
    { id: "999162626036740138", name: "Rawon #5" }
];

const getInviteUrl = (clientId: string) =>
    `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=4855722558221376&scope=bot%20applications.commands`;

export default function HomePage() {
    const { t } = useLocale();

    return (
        <>
            <Container fixed className="flex min-h-[calc(100vh-5rem)] w-full flex-col items-center justify-center px-4 py-8 pt-20 sm:px-5">
                <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-6 sm:gap-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex w-full flex-col items-center gap-4"
                    >
                        <div className="relative aspect-square h-auto w-40 sm:w-56">
                            <Image
                                src="/icons/icon-512x512.png"
                                fill
                                alt="rawon.jpg"
                                priority
                            />
                        </div>
                        <div className="flex w-full flex-col gap-4 px-4">
                            <Typography className="text-center font-sans text-2xl font-medium uppercase text-third sm:text-3xl">
                                {t.home.title}
                            </Typography>
                            <Typography className="text-center font-sans text-base font-medium text-third sm:text-xl">
                                {t.home.description}
                            </Typography>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex w-full max-w-sm flex-col items-center gap-4 px-4 sm:px-0"
                    >
                        <div className="flex w-full flex-col gap-2">
                            <Typography className="text-center font-sans text-base font-semibold uppercase text-third sm:text-lg">
                                {t.home.inviteBot}
                            </Typography>
                            <div className="grid w-full grid-cols-5 gap-2">
                                {INVITE_BOTS.map((bot, index) => (
                                    <Link
                                        key={index}
                                        href={getInviteUrl(bot.id)}
                                        passHref
                                        legacyBehavior
                                    >
                                        <a
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full"
                                        >
                                            <Button
                                                id={`inviteButton-${index + 1}`}
                                                color="inherit"
                                                className="h-11 w-full rounded-lg bg-secondary px-2 font-sans text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg sm:text-base"
                                            >
                                                #{index + 1}
                                            </Button>
                                        </a>
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <Link
                            href="https://stegripe.org/discord"
                            passHref
                            legacyBehavior
                        >
                            <a
                                target="_blank"
                                rel="noreferrer"
                                className="w-full"
                            >
                                <Button
                                    id="supportButton"
                                    color="inherit"
                                    className="h-11 w-full rounded-lg border-2 border-solid border-secondary px-6 font-sans text-base font-semibold text-secondary transition-all duration-200 hover:scale-105 hover:bg-secondary hover:text-white sm:text-lg"
                                >
                                    {t.home.support}
                                </Button>
                            </a>
                        </Link>
                        <Link href="/docs/getting-started" className="w-full">
                            <Button
                                id="docsButton"
                                color="inherit"
                                className="h-11 w-full rounded-lg border-2 border-solid border-third px-6 font-sans text-base font-semibold text-third transition-all duration-200 hover:scale-105 hover:bg-third hover:text-white sm:text-lg"
                            >
                                {t.home.viewDocs}
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </Container>
        </>
    );
}
