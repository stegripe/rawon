export class OperationManager {
    private _runningOperation!: boolean;
    private readonly operations: (() => void)[] = [];

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

    public add(operation: () => void): void {
        this.operations.push(operation);

        if (!this.runningOperation) {
            void this.runOperations();
        }
    }

    private async runOperations(): Promise<void> {
        const operation = this.operations.shift();

        if (operation) {
            this._runningOperation = true;

            try {
                await operation();
            } finally {
                void this.runOperations();
            }
        } else {
            this._runningOperation = false;
        }
    }
}
