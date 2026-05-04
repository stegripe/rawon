import { Fragment, ReactNode } from "react";

function parseMarkdown(text: string): ReactNode[] {
    if (!text) return [];

    const nodes: ReactNode[] = [];
    let i = 0;

    while (i < text.length) {
        if (text.startsWith("**", i)) {
            const close = text.indexOf("**", i + 2);
            if (close !== -1) {
                const inner = text.slice(i + 2, close);
                nodes.push(
                    <strong key={`b-${i}`} className="font-semibold">
                        {parseMarkdown(inner)}
                    </strong>
                );
                i = close + 2;
                continue;
            }
        }

        if (text[i] === "`") {
            const close = text.indexOf("`", i + 1);
            if (close !== -1 && close > i + 1) {
                nodes.push(
                    <code
                        key={`c-${i}`}
                        className="rounded bg-third/20 px-1.5 py-0.5 font-mono text-sm"
                    >
                        {text.slice(i + 1, close)}
                    </code>
                );
                i = close + 1;
                continue;
            }
        }

        if (text[i] === "[") {
            const rest = text.slice(i);
            const m = /^\[([^\]]*)\]\(([^)]*)\)/.exec(rest);
            if (m) {
                const href = m[2];
                const isRelative =
                    href.startsWith("/") ||
                    href.startsWith("#") ||
                    href.startsWith("?");
                nodes.push(
                    <a
                        key={`a-${i}`}
                        href={href}
                        {...(isRelative
                            ? {}
                            : { target: "_blank", rel: "noopener noreferrer" })}
                        className="text-secondary underline hover:text-secondary/80"
                    >
                        {parseMarkdown(m[1])}
                    </a>
                );
                i += m[0].length;
                continue;
            }
        }

        let j = i + 1;
        while (j < text.length) {
            const c = text[j];
            if (c === "`" || c === "[" || text.startsWith("**", j)) break;
            j++;
        }

        if (j > i) {
            nodes.push(<Fragment key={`t-${i}`}>{text.slice(i, j)}</Fragment>);
            i = j;
        } else {
            nodes.push(<Fragment key={`t-${i}`}>{text[i]}</Fragment>);
            i++;
        }
    }

    return nodes;
}

export const renderWithCode = (text: string): ReactNode[] => parseMarkdown(text);
