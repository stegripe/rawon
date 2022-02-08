console.log(new URL(`file://${(await import("path")).resolve("M:/abc", "abc", "bot.js")}`).toString());

export const a = "";