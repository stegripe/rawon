import { NavigationBar } from "@/components/NavigationBar";
import { LocaleProvider } from "@/contexts/LocaleContext";
import "@/styles/index.scss";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { DefaultSeo } from "next-seo";
import { AppProps } from "next/app";
import { Poppins } from "next/font/google";
import Head from "next/head";

const poppins = Poppins({
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    subsets: ["latin"]
});

const theme = createTheme({
    palette: {
        background: {
            default: "#FFF3D1"
        }
    }
});

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <>
            <style jsx global>
                {`
                    :root {
                        --font-poppins: ${poppins.style.fontFamily};
                    }
                `}
            </style>
            <Head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta
                    name="viewport"
                    content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"
                />
                <meta name="theme-color" content="#FFF3D1" />
                <link rel="manifest" href="/manifest.webmanifest" />
            </Head>
            <DefaultSeo
                title="Rawon - A simple powerful Discord music bot built to fulfill
                    your production desires."
                description="A simple powerful Discord music bot built to fulfill your production desires. Easy to use, with no coding required."
                additionalLinkTags={[
                    {
                        rel: "icon",
                        type: "image/png",
                        href: "/favicon.ico",
                        sizes: "16x16"
                    }
                ]}
                openGraph={{
                    type: "website",
                    url: "rawon.stegripe.org",
                    title: "Rawon",
                    siteName: "rawon.stegripe.og",
                    description:
                        "A simple powerful Discord music bot built to fulfill your production desires. Easy to use, with no coding required.",
                    images: [
                        {
                            url: "/icons/icon-512x512.png",
                            width: 512,
                            height: 512,
                            alt: "Rawon Logo"
                        }
                    ]
                }}
                additionalMetaTags={[
                    {
                        name: "keywords",
                        content: "discord, bot"
                    },
                    {
                        name: "robots",
                        content: "index, follow"
                    },
                    {
                        name: "author",
                        content: "Stegripe"
                    }
                ]}
            />
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <LocaleProvider>
                    <NavigationBar />
                    <Component {...pageProps} />
                </LocaleProvider>
            </ThemeProvider>
        </>
    );
}
