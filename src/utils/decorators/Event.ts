import { BaseEvent, ExtendedEventConstructor } from "../../structures/BaseEvent";
import { ClassDecorator, IEvent, NonAbstractConstructor } from "../../typings";

export function Event<T extends NonAbstractConstructor<BaseEvent> = ExtendedEventConstructor>(
    event: IEvent["name"]
): ClassDecorator<T, T> {
    return target => new Proxy(target, {
        construct: (
            trgt,
            args: [BaseEvent["client"]]
        ) => new trgt(...args, event)
    });
}
