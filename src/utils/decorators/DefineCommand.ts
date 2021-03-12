import { ICommandComponent } from "../../../typings";
import { Disc } from "../../structures/Disc";

export function DefineCommand(meta: ICommandComponent["meta"]): any {
    return function decorate<T extends ICommandComponent>(target: new (...args: any[]) => T): new (client: Disc) => T {
        return new Proxy(target, {
            construct: (ctx, [client]): T => new ctx(client, meta)
        });
    };
}
