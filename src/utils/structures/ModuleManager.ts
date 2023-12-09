import { resolve } from "node:path";
import { BotClient } from "../../structures/BotClient.js";
import { Module } from "../../typings/index.js";
import { Collection } from "discord.js";

export class ModuleManager {
    public readonly modules = new Collection<string, Module>();

    public constructor(public readonly client: BotClient) {}

    public async load(dir: string, beforeCmd?: () => Promisable<any>): Promise<void> {
        const mods = this.client.utils.readDir(dir);
        this.client.logger.info(`Loading ${mods.length} modules from "${dir}"...`);

        const commandDirs: string[] = [];

        for (const mod of mods) {
            const path = resolve(dir, mod);
            const module = await this.client.utils.importFile<{ default: Module }>(resolve(path, "module.meta.js")).then(x => x.default, () => null);

            if (!module) throw new Error(`Cannot find meta file for module "${path}".`);
            if (!module.enabled) {
                this.client.logger.info(`Module "${path}" is disabled. Skipping...`);
                continue;
            }

            if (this.modules.has(path)) throw new Error(`Module "${path}" has already been loaded.`);
            module.path = path;

            const inner = this.client.utils.readDir(path);
            if (inner.includes("commands")) commandDirs.push(path);
            if (inner.includes("events")) await this.client.events.readFromDir(resolve(path, "events"));
            if (inner.includes("modules")) await this.load(resolve(path, "modules"));

            this.modules.set(path, module);
            this.client.logger.info(`Event listeners in module "${path}" has been loaded.`);
        }

        await beforeCmd?.();

        for (const path of commandDirs) {
            await this.client.commands.readFromDir(resolve(path, "commands"));

            this.client.logger.info(`Commands in module "${path}" has been loaded.`);
        }
    }
}
