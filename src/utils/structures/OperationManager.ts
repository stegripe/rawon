import { Promisable } from "../../typings/index.js";

export class OperationManager {
    private _runningOperation!: boolean;
    private readonly operations: [(arg?: undefined) => void, (reason?: any) => void, () => Promisable<undefined>][] =
        [];

    public constructor() {
        Object.defineProperty(this, "_runningOperation", {
            configurable: false,
            enumerable: false,
            value: false,
            writable: true
        });
    }

    public get runningOperation(): boolean {
        return this._runningOperation;
    }

    public add(operation: () => Promisable<undefined>): Promise<undefined> {
        return new Promise((resolve, reject) => {
            this.operations.push([resolve, reject, operation]);

            if (!this._runningOperation) {
                void this.runOperations();
            }
        });
    }

    private async runOperations(): Promise<void> {
        const operation = this.operations.shift();

        if (operation) {
            this._runningOperation = true;
            try {
                await operation[2]();
                operation[0]();
            } catch (err) {
                operation[1](err);
            } finally {
                void this.runOperations();
            }
        } else {
            this._runningOperation = false;
        }
    }
}
