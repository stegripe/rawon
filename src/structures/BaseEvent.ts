import { Event } from "../typings";
import { Rawon } from "./Rawon";

export abstract class BaseEvent implements Event {
    public constructor(public client: Rawon, public readonly name: Event["name"]) {}

    public abstract execute(...args: any): any;
}

export type ExtendedEventConstructor = new (...args: ConstructorParameters<typeof BaseEvent>) => BaseEvent;
