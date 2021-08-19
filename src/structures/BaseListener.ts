import { IListener } from "../typings";
import { Client } from "discord.js";

export class BaseListener implements IListener {
    public constructor(public readonly client: Client, public name: IListener["name"]) {}

    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    public execute(...args: any): void {}
}
