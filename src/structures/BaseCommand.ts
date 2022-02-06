/* eslint-disable @typescript-eslint/no-unused-vars */
import { CommandContext } from "./CommandContext";
import { ICommandComponent } from "../typings";
import { Rawon } from "./Rawon";
import { CommandInteraction, Message, SelectMenuInteraction } from "discord.js";

export abstract class BaseCommand implements ICommandComponent {
    public constructor(public client: Rawon, public meta: ICommandComponent["meta"]) {}

    public abstract execute(ctx: CommandContext): any;
}
