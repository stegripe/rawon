import { CommandComponent } from "../typings/index.js";
import { CommandContext } from "./CommandContext.js";
import { BotClient } from "./BotClient.js";

export abstract class BaseCommand implements CommandComponent {
    public constructor(public readonly client: BotClient, public meta: CommandComponent["meta"]) {}

    public abstract execute(ctx: CommandContext): any;
}

export type CommandConstructor = new (
    ...args: ConstructorParameters<typeof BaseCommand>
) => BaseCommand;
