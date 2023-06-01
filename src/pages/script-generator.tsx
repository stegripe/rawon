import { ArrowBackRounded } from "@mui/icons-material";
import { Button, Container, Input, Typography } from "@mui/material";
import Link from "next/link";
import { useRef, useState } from "react";
import { CopyBlock, dracula } from "react-code-blocks";

export default function ScriptGeneratorPage() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [URL, setURL] = useState([]);

    const addURL = () => {
        if (inputRef.current.value) {
            setURL([...URL, inputRef?.current?.value]);
            inputRef.current.value = "";
        }
    };

    return (
        <>
            <Container
                fixed
                className="relative flex min-h-[calc(100vh-80px)] w-full px-5 py-3 pb-10 pt-0 text-third"
            >
                <div className="flex w-full flex-col gap-4">
                    <div className="flex w-full items-center gap-2">
                        <Link href="/" className="text-inherit no-underline">
                            <Button
                                id="backButton"
                                color="inherit"
                                startIcon={
                                    <ArrowBackRounded className="text-3xl" />
                                }
                                sx={{
                                    "&>span": {
                                        margin: 0
                                    }
                                }}
                                className="min-w-0 p-0"
                            />
                        </Link>
                        <Typography className="font-sans text-xl font-medium">
                            Script Generator
                        </Typography>
                    </div>
                    <div className="grid w-full gap-2 md:grid-cols-2">
                        <div className="flex w-full flex-col gap-3">
                            <div className="flex w-full flex-col gap-1">
                                <Typography className="font-sans text-lg font-medium">
                                    URL
                                </Typography>
                                <Input
                                    inputRef={inputRef}
                                    disableUnderline
                                    fullWidth
                                    className="h-10 rounded-lg border-1 border-solid px-3"
                                />
                            </div>
                            <div className="flex w-full gap-3">
                                <Button
                                    onClick={addURL}
                                    variant="contained"
                                    color="primary"
                                    className="flex-grow rounded-lg font-sans capitalize"
                                >
                                    Add URL
                                </Button>
                                <Button
                                    onClick={() => setURL([])}
                                    variant="contained"
                                    color="error"
                                    className="flex-grow rounded-lg font-sans capitalize"
                                >
                                    Clear URL
                                </Button>
                            </div>
                        </div>
                        <CopyBlock
                            showLineNumbers
                            codeBlock
                            language="js"
                            theme={dracula}
                            wrapLonglines
                            text={`function trigger() {
    const url = ${
        URL.length
            ? `[
        ${URL.map(x => `"${x}"`).join(",\n        ")}
    ];`
            : "[];"
    }
    for (const uri of urls) {
        try {
            UrlFetchApp.fetch(uri);
        } catch (err) {
            Logger.log(err.message);
        }
    }
}
`}
                        />
                    </div>
                </div>
            </Container>
        </>
    );
}
