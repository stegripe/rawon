import { IListener } from "../../typings";
import { Disc_11 } from "./Disc_11";

export class BaseListener implements IListener {
    public constructor(public readonly client: Disc_11, public name: IListener["name"]) {}

    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    public execute(...args: any): void {}
}
