import { DiscordEmbedData } from "../typings";
import { useState } from "react";

function HTMLDiscordEmbed({ embed }: { embed: DiscordEmbedData }): JSX.Element {
    return (
        <div className="rounded border-l-4 bg-gray-800 w-96 h-20 p-3" style={{
            borderColor: embed.color.toString(16)
        }}>
            <div id="embed-footer" className="flex items-center">
                <img src={embed.author.icon_url} alt="" className="w-5 h-auto rounded-full"/>
                <a className="ml-2 text-white text-sm" href={embed.author.url}>{embed.author.name}</a>
            </div>
            <a className="font-bold text-xl mt-4" href={embed.url}>{embed.title}</a>
        </div>
    );
}

export default function EmbedVisualizer(): JSX.Element {
    const [data] = useState<DiscordEmbedData>({
        author: {
            name: "ABC",
            url: "",
            icon_url: "https://disc-11.zhycorp.net/logo512.png"
        },
        color: 0x000000,
        description: "",
        fields: [],
        footer: {
            text: "",
            icon_url: ""
        },
        image: {
            url: ""
        },
        thumbnail: {
            url: ""
        },
        timestamp: "",
        title: "Ehe",
        url: ""
    });

    return (
        <div className="flex items-center justify-center h-screen dark:bg-gray-900">
            <HTMLDiscordEmbed embed={data} />
        </div>
    );
}
