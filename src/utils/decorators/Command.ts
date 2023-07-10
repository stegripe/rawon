import { ClassDecorator, NonAbstractConstructor, CommandComponent } from "../../typings/index.js";
import { BaseCommand, ExtendedCommandConstructor } from "../../structures/BaseCommand.js";

export function Command<T extends NonAbstractConstructor<BaseCommand> = ExtendedCommandConstructor>(
    meta: CommandComponent["meta"]
): ClassDecorator<T, T> {
    return target =>
        new Proxy(target, {
            construct: (trgt, args: [BaseCommand["client"]]) => new trgt(...args, meta)
        });
}
