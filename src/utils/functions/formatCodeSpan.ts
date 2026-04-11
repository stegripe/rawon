export function formatCodeSpan(value: string): string {
    const text = `${value}`;
    const backtickRuns = [...text.matchAll(/`+/gu)].map((match) => match[0].length);
    const maxBackticks = backtickRuns.length > 0 ? Math.max(...backtickRuns) : 0;
    const fence = "`".repeat(maxBackticks + 1);
    const padded = text.startsWith("`") || text.endsWith("`") ? ` ${text} ` : text;

    return `${fence}${padded}${fence}`;
}

export function formatBoldCodeSpan(value: string): string {
    return `**${formatCodeSpan(value)}**`;
}

export function formatPrefixedCommand(prefix: string, command: string): string {
    return formatCodeSpan(`${prefix}${command}`);
}

export function formatBoldPrefixedCommand(prefix: string, command: string): string {
    return formatBoldCodeSpan(`${prefix}${command}`);
}
