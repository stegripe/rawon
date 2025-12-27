import { Fragment, ReactNode } from "react";

export const renderWithCode = (text: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    let currentIndex = 0;
    
    const regex = /(`[^`]*`|\*\*[^*]*\*\*|\[[^\]]+\]\([^)]+\))/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
        if (match.index > currentIndex) {
            parts.push(
                <Fragment key={`text-${currentIndex}`}>
                    {text.slice(currentIndex, match.index)}
                </Fragment>
            );
        }
        
        const matched = match[0];
        if (matched.startsWith("`") && matched.endsWith("`")) {
            const codeContent = matched.slice(1, -1);
            parts.push(
                <code
                    key={`code-${match.index}`}
                    className="rounded bg-third/20 px-1.5 py-0.5 font-mono text-sm"
                >
                    {codeContent}
                </code>
            );
        } else if (matched.startsWith("**") && matched.endsWith("**")) {
            const boldContent = matched.slice(2, -2);
            parts.push(
                <strong key={`bold-${match.index}`}>
                    {boldContent}
                </strong>
            );
        } else if (matched.startsWith("[") && matched.includes("](")) {
            const linkMatch = matched.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (linkMatch) {
                const linkText = linkMatch[1];
                const linkUrl = linkMatch[2];
                parts.push(
                    <a
                        key={`link-${match.index}`}
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline hover:text-primary/80"
                    >
                        {linkText}
                    </a>
                );
            }
        }
        
        currentIndex = match.index + matched.length;
    }
    
    if (currentIndex < text.length) {
        parts.push(
            <Fragment key={`text-${currentIndex}`}>
                {text.slice(currentIndex)}
            </Fragment>
        );
    }
    
    return parts;
};
