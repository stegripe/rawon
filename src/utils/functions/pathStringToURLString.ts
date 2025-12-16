import { URL } from "node:url";

export const pathStringToURLString = (path: string): string => new URL(`file://${path}`).toString();
