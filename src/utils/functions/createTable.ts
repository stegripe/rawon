export function createTable(values: string[][]): string {
    const value = values
        .map(
            x =>
                `${x
                    .map((y, i) => {
                        const sortingArr = [...values];
                        const spacing = " ".repeat(
                            sortingArr.sort((a, b) => (b[i] ?? "").length - (a[i] ?? "").length)[0][i].length - y.length
                        );

                        return `${y}${spacing}`;
                    })
                    .join("   ::   ")}`
        )
        .join("\n");

    return value;
}
