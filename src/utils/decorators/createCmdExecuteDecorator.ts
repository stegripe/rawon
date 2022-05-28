import { createMethodDecorator } from "./createMethodDecorator";
import { MethodDecorator, Promisable } from "../../typings";
import { BaseCommand } from "../../structures/BaseCommand";

export function createCmdExecuteDecorator(
    func: (...args: Parameters<BaseCommand["execute"]>) => Promisable<boolean | undefined>
): MethodDecorator<BaseCommand, void> {
    return createMethodDecorator<BaseCommand, BaseCommand["execute"]>(func);
}
