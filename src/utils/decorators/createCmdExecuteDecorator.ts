import { type CommandContext, type ContextCommand } from "@stegripe/command-context";
import { type MethodDecorator, type Promisable } from "../../typings/index.js";
import { createMethodDecorator } from "./createMethodDecorator.js";

export function createCmdExecuteDecorator(
    func: (ctx: CommandContext) => Promisable<boolean | undefined>,
): MethodDecorator<ContextCommand, void> {
    return createMethodDecorator<ContextCommand, ContextCommand["contextRun"]>(func);
}
