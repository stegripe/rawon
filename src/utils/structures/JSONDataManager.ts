import { OperationManager } from "./OperationManager.js";
import { readFile, writeFile } from "node:fs/promises";

export class JSONDataManager<T> {
    private readonly manager = new OperationManager();
    private _data: T | null = null;

    public constructor(public readonly fileDir: string) {
        void this.load();
    }

    public get data(): T | null {
        return this._data;
    }

    public async save(data: () => T): Promise<T | null> {
        await this.manager.add(async () => {
            const dat = data();
            await writeFile(this.fileDir, JSON.stringify(dat));

            return undefined;
        });

        return this.load();
    }

    private async load(): Promise<T | null> {
        try {
            await this.manager.add(async () => {
                this._data = JSON.parse((await readFile(this.fileDir, "utf8")).toString());
                return undefined;
            });
            return this._data!;
        } catch {
            return this.data;
        }
    }
}
