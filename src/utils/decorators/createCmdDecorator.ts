import { createMethodDecorator } from "./createMethodDecorator.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { MethodDecorator } from "../../typings/index.js";

export function createCmdDecorator(
    func: (...args: Parameters<BaseCommand["execute"]>) => Promisable<boolean | undefined>
): MethodDecorator<BaseCommand, void> {
    return createMethodDecorator<BaseCommand, BaseCommand["execute"]>(func);
}
