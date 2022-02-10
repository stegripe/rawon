export function pathStringToURLString(path: string): string {
    const urlStr = new URL(`file://${path}`).toString();

    return urlStr;
}
