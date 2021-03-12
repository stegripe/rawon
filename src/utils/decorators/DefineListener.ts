import { IListener } from "../../../typings";
import { Disc } from "../../structures/Disc";

export function DefineListener(name: IListener["name"]): any {
    return function decorate<T extends IListener>(target: new (...args: any[]) => T): new (client: Disc) => T {
        return new Proxy(target, {
            construct: (ctx, [client]): T => new ctx(client, name)
        });
    };
}
