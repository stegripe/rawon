import { IEvent } from "../typings";
import { Disc } from "./Disc";

export abstract class BaseEvent implements IEvent {
    public constructor(public client: Disc, public readonly name: IEvent["name"]) {}

    public abstract execute(...args: any): any;
}
