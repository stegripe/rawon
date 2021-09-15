/* eslint-disable @typescript-eslint/no-unused-vars */
import { CommandContext } from "./CommandContext";
import { ICommandComponent } from "../typings";
import { Disc } from "./Disc";
import { CommandInteraction, Message, SelectMenuInteraction } from "discord.js";

export class BaseCommand implements ICommandComponent {
    public constructor(public client: Disc, public meta: ICommandComponent["meta"]) {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    public execute(message: CommandContext, ...any: any): any {}

    public reload(): ICommandComponent {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete require.cache[require.resolve(this.meta.path!)];
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const newCMD = new (require(this.meta.path!).default)(this.client, { path: this.meta.path, category: this.meta.category });
        this.client.commands.get(this.meta.name)!.execute = newCMD.execute;
        this.client.commands.get(this.meta.name)!.meta = newCMD.meta;
        this.client.logger.info(`Command ${this.meta.name} from ${this.meta.category!} category has been reloaded.`);
        return this.client.commands.get(this.meta.name)!;
    }
}
