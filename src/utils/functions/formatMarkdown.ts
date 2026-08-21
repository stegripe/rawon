import { parseHTMLElements } from "./parseHTMLElements.js";

const ZERO_WIDTH_BREAK = "\u200b";

function neutralizeMarkdown(value: string): string {
    return parseHTMLElements(`${value}`)
        .replaceAll("[", `${ZERO_WIDTH_BREAK}[`)
        .replaceAll("]", `]${ZERO_WIDTH_BREAK}`)
        .replaceAll(/[*_~`|]/gu, (match) => `${match}${ZERO_WIDTH_BREAK}`);
}

function formatMarkdownLinkUrl(url: string): string {
    return encodeURI(url).replaceAll("(", "%28").replaceAll(")", "%29");
}

export function formatMarkdownText(value: string): string {
    return neutralizeMarkdown(value);
}

export function formatMarkdownLink(label: string, url: string | undefined | null): string {
    const safeUrl = url?.trim();
    if (!safeUrl) {
        return formatMarkdownText(label);
    }
    return `[${formatMarkdownText(label)}](${formatMarkdownLinkUrl(safeUrl)})`;
}

export function formatBoldMarkdownLink(label: string, url: string | undefined | null): string {
    return `**${formatMarkdownLink(label, url)}**`;
}
