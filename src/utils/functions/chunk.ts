export function chunk<T extends unknown[] | string = string>(arr: T, len: number): T[] {
    const res = [];
    for (let i = 0; i < arr.length; i += len) {
        res.push(arr.slice(i, i + len));
    }

    return res as T[];
}
