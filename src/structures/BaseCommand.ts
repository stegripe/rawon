/* eslint-disable @typescript-eslint/no-unused-vars */
import { CommandContext } from "./CommandContext";
import { ICommandComponent } from "../typings";
import { Disc } from "./Disc";
import { CommandInteraction, Message, SelectMenuInteraction } from "discord.js";

export class BaseCommand implements ICommandComponent {
    public constructor(public client: Disc, public meta: ICommandComponent["meta"]) {}

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public execute(message: CommandContext, ...any: any): any {}
}
