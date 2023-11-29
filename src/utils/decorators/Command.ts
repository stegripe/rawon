import { BaseCommand, CommandConstructor } from "../../structures/BaseCommand.js";
import { ClassDecorator, NonAbstractConstructor } from "../../typings/index.js";

export function Command<T extends NonAbstractConstructor<BaseCommand> = CommandConstructor>(
    meta: BaseCommand["meta"]
): ClassDecorator<T, T> {
    return target => new Proxy(target, {
        construct: (trgt, args: [BaseCommand["client"]]) => new trgt(...args, meta)
    });
}
