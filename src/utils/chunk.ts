export function chunk<T>(arr: T[], len: number): T[][];
export function chunk(arr: string, len: number): string[];
export function chunk(...args: any[]): any[] {
    const [arr, len] = args as [any, number];
    const rest: (typeof arr)[] = [];
    for (let i = 0; i < (arr as string).length; i += len) { rest.push((arr as string).slice(i, i + len)); }
    return rest;
}
