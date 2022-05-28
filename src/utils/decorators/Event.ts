import { ClassDecorator, Event as EI, NonAbstractConstructor } from "../../typings";
import { BaseEvent, ExtendedEventConstructor } from "../../structures/BaseEvent";

export function Event<T extends NonAbstractConstructor<BaseEvent> = ExtendedEventConstructor>(
    event: EI["name"]
): ClassDecorator<T, T> {
    return target =>
        new Proxy(target, {
            construct: (trgt, args: [BaseEvent["client"]]) => new trgt(...args, event)
        });
}
