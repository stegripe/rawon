import { type FunctionType, type MethodDecorator, type Promisable } from "../../typings/index.js";

export function createMethodDecorator<TC = any, Target extends FunctionType = FunctionType>(
    func: (...args: Parameters<Target>) => Promisable<boolean | undefined>,
): MethodDecorator<TC, any> {
    return (_target, _, descriptor) => {
        const originalMethod = descriptor.value as Target;

        descriptor.value = async function value(...args: Parameters<Target>) {
            const res = await func(...args);
            if (res === false) {
                return;
            }

            originalMethod.apply(this, args);
        };
    };
}
