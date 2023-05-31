import { Head, Html, Main, NextScript } from "next/document";

export default function MyDocument() {
    return (
        <Html
            className="overflow-x-hidden overflow-y-scroll scroll-smooth"
            lang="en"
        >
            <Head />
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
