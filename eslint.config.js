import { common, modules, node, prettier, typescript, extend, ignores } from "@stegripe/eslint-config";

export default [...common, ...modules, ...node, ...prettier, ...extend(typescript, [{
    rule: "typescript/no-unnecessary-condition",
    option: ["off"]
}], ...ignores)];
