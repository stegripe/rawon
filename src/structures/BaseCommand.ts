import { resolve } from "path";
import type Disc_11 from "./Disc_11";
import type { CommandComponent } from "../../typings";
import type { Message } from "discord.js";
export default class BaseCommand implements CommandComponent {
    public conf: CommandComponent["conf"];
    public help: CommandComponent["help"];
    public constructor(public client: Disc_11, public readonly path: string, conf: CommandComponent["conf"], help: CommandComponent["help"]) {
        this.conf = {
            aliases: [],
            cooldown: 3,
            disable: false,
            path: resolve(this.path)
        };
        this.help = {
            name: "",
            description: "",
            usage: ""
        };
        Object.assign(this.conf, conf);
        Object.assign(this.help, help);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    public execute(message: Message, args: string[]): any {}
}
