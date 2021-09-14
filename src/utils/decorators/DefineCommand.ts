import { BotClient } from "../../structures/BotClient";
import { ICommandComponent } from "../../typings";

export function DefineCommand(meta: ICommandComponent["meta"]): any {
    return function decorate<T extends ICommandComponent>(target: new (...args: any[]) => T): new (client: BotClient) => T {
        return new Proxy(target, {
            construct: (ctx, [client]): T => new ctx(client, meta)
        });
    };
}
