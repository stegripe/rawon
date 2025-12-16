export function createProgressBar(current: number, total: number): string {
    const pos = Math.ceil(current / total * 15) || 1;

    return `\`${"▬".repeat(pos - 1)}🔘${"▬".repeat(15 - pos)}\``;
}
