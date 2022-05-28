export const pathStringToURLString = (path: string): string => new URL(`file://${path}`).toString();
