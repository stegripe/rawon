import { IEvent } from "../typings";
import { Disc } from "./Disc";

export class BaseEvent implements IEvent {
    public constructor(public client: Disc, public readonly name: IEvent["name"]) {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    public execute(...args: any): any {}
}
