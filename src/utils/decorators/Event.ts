import type { BaseEvent, ExtendedEventConstructor } from "../../structures/BaseEvent.js";
import type { ClassDecorator, Event as EI, NonAbstractConstructor } from "../../typings/index.js";

export function Event<T extends NonAbstractConstructor<BaseEvent> = ExtendedEventConstructor>(
    event: EI["name"]
): ClassDecorator<T, T> {
    return target =>
        new Proxy(target, {
            construct: (trgt, args: [BaseEvent["client"]]) => new trgt(...args, event)
        });
}
