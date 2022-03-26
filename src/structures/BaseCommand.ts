import { CommandContext } from "./CommandContext";
import { CommandComponent } from "../typings";
import { Rawon } from "./Rawon";

export abstract class BaseCommand implements CommandComponent {
    public constructor(public client: Rawon, public meta: CommandComponent["meta"]) {}

    public abstract execute(ctx: CommandContext): any;
}

export type ExtendedCommandConstructor = new (...args: ConstructorParameters<typeof BaseCommand>) => BaseCommand;
