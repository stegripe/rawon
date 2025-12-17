import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { OperationManager } from "./OperationManager.js";

export class JSONDataManager<T> {
    private readonly manager = new OperationManager();
    private _data: T | null = null;

    public constructor(public readonly fileDir: string) {
        this.ensureDirectory();
        void this.load();
    }

    private ensureDirectory(): void {
        const dir = path.dirname(this.fileDir);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
    }

    public get data(): T | null {
        return this._data;
    }

    public async save(data: () => T): Promise<T | null> {
        await this.manager.add(async () => {
            const dat = data();
            await writeFile(this.fileDir, JSON.stringify(dat));
        });

        return this.load();
    }

    private async load(): Promise<T | null> {
        try {
            await this.manager.add(async () => {
                this._data = JSON.parse(
                    await readFile(this.fileDir, "utf8").then((x) => x.toString()),
                ) as T;
            });

            return this._data;
        } catch {
            return this.data;
        }
    }
}
