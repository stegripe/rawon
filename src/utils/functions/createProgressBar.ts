export function createProgressBar(current: number, total: number): string {
    if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) {
        return `\`🔘${"▬".repeat(14)}\``;
    }

    const ratio = Math.max(0, Math.min(1, current / total));
    const pos = Math.ceil(ratio * 15) || 1;

    return `\`${"▬".repeat(pos - 1)}🔘${"▬".repeat(15 - pos)}\``;
}
