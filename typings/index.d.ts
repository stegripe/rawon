export interface IPerm {
    name: string;
    value: number;
    auth?: boolean;
    type: "general"|"text"|"voice";
}

export interface DiscordEmbedData {
    title: string;
    description: string;
    url: string;
    timestamp: string;
    color: number;
    footer: {
        text: string;
        icon_url: string;
    };
    image: {
        url: string;
    };
    thumbnail: {
        url: string;
    };
    author: {
        name: string;
        url: string;
        icon_url: string;
    };
    fields: {
        name: string;
        value: string;
        inline: boolean;
    }[];
}
