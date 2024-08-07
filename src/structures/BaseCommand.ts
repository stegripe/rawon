import type { CommandComponent } from "../typings/index.js";
import type { CommandContext } from "./CommandContext.js";
import type { Rawon } from "./Rawon.js";

export abstract class BaseCommand implements CommandComponent {
    public constructor(public client: Rawon, public meta: CommandComponent["meta"]) { }

    public abstract execute(ctx: CommandContext): any;
}

export type ExtendedCommandConstructor = new (...args: ConstructorParameters<typeof BaseCommand>) => BaseCommand;
