export const escapedHTMLElements: Record<string, string> = {
    "\"": "&quot;",
    "&": "&amp;",
    "'": "&#39;",
    "/": "&#x2F;",
    "<": "&lt;",
    "=": "&#x3D;",
    ">": "&gt;",
    "`": "&#x60;"
};

export function parseHTMLElements(text: string): string {
    let res = text;
    const sortedElements = Object.keys(escapedHTMLElements).sort((a, b) => {
        if (a === "&") return 1;
        if (b === "&") return -1;
        return 0;
    });

    for (const key of sortedElements) {
        res = res.replace(new RegExp(escapedHTMLElements[key], "g"), key);
    }

    return res;
}
