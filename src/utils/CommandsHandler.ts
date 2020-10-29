import { promises as fs } from "fs";
import { resolve } from "path";
import type { Message, Snowflake } from "discord.js";
import { Collection } from "discord.js";
import type Disc_11 from "../structures/Disc_11";
import type { CommandComponent } from "../../typings";

export default class CommandsHandler {
    public readonly commands: Collection<string, CommandComponent> = new Collection();
    public readonly aliases: Collection<string, string> = new Collection();
    public readonly cooldowns: Collection<string, Collection<Snowflake, number>> = new Collection();
    public constructor(public client: Disc_11, public readonly path: string) {}
    public load(): void {
        fs.readdir(resolve(this.path))
            .then(async files => {
                let disabledCount = 0;
                for (const file of files) {
                    const path = resolve(this.path, file);
                    const command: CommandComponent = new (await import(path).then(m => m.default))(this.client, path);
                    if (Number(command.conf.aliases?.length) > 0) {
                        command.conf.aliases?.forEach(alias => {
                            this.aliases.set(alias, command.help.name);
                        });
                    }
                    this.commands.set(command.help.name, command);
                    if (command.conf.disable === true) disabledCount++;
                }
                this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} A total of ${files.length} commands has been loaded!`);
                if (disabledCount !== 0) this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} ${disabledCount} out of ${files.length} commands is disabled.`);
            })
            .catch(err => this.client.logger.error("CMD_LOADER_ERR:", err));
        return undefined;
    }

    public handle(message: Message): any {
        const args = message.content.substring(this.client.config.prefix.length).trim().split(/ +/g);
        const cmd = args.shift()?.toLowerCase();
        const command = this.commands.get(cmd!) ?? this.commands.get(this.aliases.get(cmd!)!);
        if (!command || command.conf.disable) return undefined;
        if (!this.cooldowns.has(command.help.name)) this.cooldowns.set(command.help.name, new Collection());
        const now = Date.now();
        const timestamps: Collection<Snowflake, number> = this.cooldowns.get(command.help.name)!;
        const cooldownAmount = (command.conf.cooldown ?? 3) * 1000;
        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id)! + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                message.channel.send(`<@${message.author.id}>, please wait **\`${timeLeft.toFixed(1)}\`** of cooldown time.`).then((msg: Message) => {
                    msg.delete({ timeout: 3500 }).catch(e => this.client.logger.error("CMD_HANDLER_ERR:", e));
                }).catch(e => this.client.logger.error("CMD_HANDLER_ERR:", e));
                return undefined;
            }

            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        } else {
            timestamps.set(message.author.id, now);
            if (this.client.config.owners.includes(message.author.id)) timestamps.delete(message.author.id);
        }
        try {
            return command.execute(message, args);
        } catch (e) {
            this.client.logger.error("CMD_HANDLER_ERR:", e);
        } finally {
            this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} ${message.author.tag} is using ${command.help.name} command on ${message.guild ? message.guild.name : "DM Channel"}`);
        }
    }
}
