import { createMethodDecorator } from "./createMethodDecorator.js";
import { MethodDecorator, Promisable } from "../../typings/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";

export function createCmdExecuteDecorator(
    func: (...args: Parameters<BaseCommand["execute"]>) => Promisable<boolean | undefined>
): MethodDecorator<BaseCommand, void> {
    return createMethodDecorator<BaseCommand, BaseCommand["execute"]>(func);
}
