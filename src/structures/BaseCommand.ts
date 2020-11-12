import { Disc_11 } from "./Disc_11";
import { ICommandComponent } from "../../typings";
import { Message } from "discord.js";
export class BaseCommand implements ICommandComponent {
    public constructor(public client: Disc_11, public meta: ICommandComponent["meta"]) {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    public execute(message: Message, args: string[]): any {}
}
