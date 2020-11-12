import { ClientEventListener } from "../../../typings";
import Disc_11 from "../../structures/Disc_11";

export function DefineListener(name: ClientEventListener["name"]): any {
    return function decorate<T extends ClientEventListener>(target: new (...args: any[]) => T): new (client: Disc_11) => T {
        return new Proxy(target, {
            construct: (ctx, [client]): T => new ctx(client, name)
        });
    };
}