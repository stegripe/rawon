import { parse } from "@messageformat/parser";
import data from "./locales/en.json" assert { type: "json" };
import { writeFileSync } from "fs";

/**
 * @param {ReturnType<typeof parse>} arr 
 */
function getVariables(arr) {
    const vars = [];
    const queue = arr;

    while (queue.length) {
        const obj = queue.shift();

        if (obj.type === "argument") {
            vars.push(`"${obj.arg}": string;`);
        } else if (obj.type === "plural" || obj.type === "selectordinal" || obj.type === "select") {
            vars.push(`"${obj.arg}": ${obj.type === "select" ? "string" : "number"};`);
            queue.push(...obj.cases.map(c => c.tokens).flat());
        }
    }

    return vars;
}

const date = new Date();
const f = x => x < 10 ? `0${x}` : x;

let res = `/* eslint-disable max-lines */\n/*\n    This file is auto-generated for locale typings.\n    Generated on ${f(date.getUTCDate())}/${f(date.getUTCMonth()+1)}/${f(date.getUTCFullYear())}.\n*/\n\nexport interface RawonLang {`;
const queue = [[data, ""]];

while (queue.length) {
    const obj = queue.shift();
    for (const k in obj[0]) {
        const v = obj[0][k];
        if (typeof v === "object") {
            queue.push([v, `${obj[1] ? `${obj[1]}.` : ""}${k}`]);
            continue;
        }

        const vars = getVariables(parse(v));

        res += `\n    "${obj[1] ? `${obj[1]}.` : ""}${k}": ${vars.length ? `{\n${vars.map(x => `        ${x}`).join("\n")}\n    }` : "string"};`;
    }
}

res += "\n}\n";

writeFileSync("./src/typings/langs.d.ts", res);

console.log("Generated typings for locales.")
