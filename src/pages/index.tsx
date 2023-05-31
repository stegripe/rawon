import { Button, Container, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
    return (
        <>
            <Container fixed className="flex h-screen w-full px-5 py-0 pt-0">
                <div className="flex h-full w-full flex-col items-center justify-center gap-10">
                    <div className="flex w-full flex-col items-center gap-4">
                        <div className="relative aspect-square h-auto w-56">
                            <Image
                                src="/icons/icon-512x512.png"
                                fill
                                alt="rawon.jpg"
                            />
                        </div>
                        <div className="flex w-full flex-col gap-4">
                            <Typography className="text-center font-sans text-3xl font-medium uppercase text-third">
                                rawon
                            </Typography>
                            <Typography className="text-center font-sans text-xl font-medium text-third">
                                A simple powerful Discord music bot built to
                                fulfill your production desires.
                            </Typography>
                        </div>
                    </div>
                    <div className="flex w-full flex-col items-center gap-4">
                        <Link
                            href="https://discord.com/api/oauth2/authorize?client_id=999162626036740138&permissions=275183430727&scope=applications.commands%20bot"
                            passHref
                            legacyBehavior
                        >
                            <a target="_blank" rel="noreferrer">
                                <Button
                                    id="inviteButton"
                                    color="inherit"
                                    className="h-9 w-48 rounded-lg bg-secondary font-sans text-lg font-semibold text-white"
                                >
                                    invite
                                </Button>
                            </a>
                        </Link>
                        <Link
                            href="https://clytage.org/discord"
                            passHref
                            legacyBehavior
                        >
                            <a target="_blank" rel="noreferrer">
                                <Button
                                    id="supportButton"
                                    color="inherit"
                                    className="h-9 w-48 rounded-lg border-2 border-solid border-secondary font-sans text-lg font-semibold text-secondary"
                                >
                                    support
                                </Button>
                            </a>
                        </Link>
                    </div>
                </div>
            </Container>
        </>
    );
}
