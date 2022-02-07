import { IEvent } from "../typings";
import { Rawon } from "./Rawon";

export abstract class BaseEvent implements IEvent {
    public constructor(public client: Rawon, public readonly name: IEvent["name"]) {}

    public abstract execute(...args: any): any;
}
