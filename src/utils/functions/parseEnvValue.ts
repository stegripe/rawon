export function parseEnvValue(str: string): string[] {
    return (
        str
            .match(/(?<=(?:\s+|^))(?<str>['"])?(?:.*?)\k<str>(?=(?:(?:[,;])|(?:(?:\s+)?$)))/g)
            ?.filter(x => Boolean(x.trim()))
            .map(x =>
                (x.startsWith("'") && x.endsWith("'")) || (x.startsWith('"') && x.endsWith('"'))
                    ? x.slice(1, x.length - 1)
                    : x
            ) ?? []
    );
}
