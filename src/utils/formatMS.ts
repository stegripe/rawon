import prettyMilliseconds from "pretty-ms";

export function formatMS(ms: number): string {
    if (isNaN(ms)) throw new Error("value is not a number.");
    return prettyMilliseconds(ms, {
        verbose: true,
        compact: false,
        secondsDecimalDigits: 0
    });
}
