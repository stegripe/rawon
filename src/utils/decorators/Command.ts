import type { BaseCommand, ExtendedCommandConstructor } from "../../structures/BaseCommand.js";
import type { ClassDecorator, CommandComponent, NonAbstractConstructor } from "../../typings/index.js";

export function Command<T extends NonAbstractConstructor<BaseCommand> = ExtendedCommandConstructor>(
    meta: CommandComponent["meta"]
): ClassDecorator<T, T> {
    return target =>
        new Proxy(target, {
            construct: (trgt, args: [BaseCommand["client"]]) => new trgt(...args, meta)
        });
}
