import { parseHTMLElements } from "./parseHTMLElements.js";

const ZERO_WIDTH_BREAK = "\u200b";

function neutralizeMarkdown(value: string): string {
    return parseHTMLElements(`${value}`)
        .replaceAll("[", "\uff3b")
        .replaceAll("]", "\uff3d")
        .replaceAll(/[*_~`|]/gu, (match) => `${match}${ZERO_WIDTH_BREAK}`);
}

export function formatMarkdownText(value: string): string {
    return neutralizeMarkdown(value);
}

export function formatMarkdownLink(label: string, url: string | undefined | null): string {
    const safeUrl = url?.trim();
    if (!safeUrl) {
        return formatMarkdownText(label);
    }
    return `[${formatMarkdownText(label)}](${safeUrl})`;
}

export function formatBoldMarkdownLink(label: string, url: string | undefined | null): string {
    return `**${formatMarkdownLink(label, url)}**`;
}
