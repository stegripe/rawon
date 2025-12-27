import { useLocale } from "@/contexts/LocaleContext";
import { Button, Container, Typography } from "@mui/material";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
    const { t } = useLocale();

    return (
        <>
            <Container fixed className="flex min-h-screen w-full flex-col items-center justify-center px-5 py-0 pt-0">
                <div className="flex w-full flex-col items-center justify-center gap-10 py-8">
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
                        <Link
                            href="https://discord.com/api/oauth2/authorize?client_id=999162626036740138&permissions=275183430727&scope=applications.commands%20bot"
                            passHref
                            legacyBehavior
                        >
                            <a
                                target="_blank"
                                rel="noreferrer"
                                className="w-full"
                            >
                                <Button
                                    id="inviteButton"
                                    color="inherit"
                                    className="h-11 w-full rounded-lg bg-secondary px-6 font-sans text-base font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg sm:text-lg"
                                >
                                    {t.home.invite}
                                </Button>
                            </a>
                        </Link>
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
