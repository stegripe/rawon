import { MethodDecorator, Promisable } from "../../typings";
import { BaseCommand } from "../../structures/BaseCommand";

export function createCmdExecuteDecorator(
    func: (...args: Parameters<BaseCommand["execute"]>) => Promisable<boolean | undefined>
): MethodDecorator<BaseCommand, void> {
    return (target, _, descriptor) => {
        const originalMethod = descriptor.value as BaseCommand["execute"];

        descriptor.value = async function value(...args: Parameters<BaseCommand["execute"]>) {
            const res = await func(...args);
            if (res === false) return;

            return originalMethod.apply(this, args);
        };
    };
}
