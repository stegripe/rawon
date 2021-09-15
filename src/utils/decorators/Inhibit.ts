import { CommandContext } from "../../structures/CommandContext";
import { ICommandComponent } from "../../typings";

export function Inhibit(func: ICommandComponent["execute"]) {
    return function decorate(target: unknown, key: string | symbol, descriptor: PropertyDescriptor): any {
        const original = descriptor.value;
        // eslint-disable-next-line func-names
        descriptor.value = async function (ctx: CommandContext): Promise<any> {
            const result = await func(ctx);
            if (result === undefined) return original.apply(this, [ctx]);
            return null;
        };

        return descriptor;
    };
}
