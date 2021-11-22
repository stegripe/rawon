import { CommandContext } from "../structures/CommandContext";
import { ICategoryMeta, ICommandComponent } from "../typings";
import { createEmbed } from "./createEmbed";
import { Disc } from "../structures/Disc";
import { ApplicationCommandData, Collection, Message, Snowflake, TextChannel } from "discord.js";
import { promises as fs } from "fs";
import { resolve } from "path";

export class CommandManager extends Collection<string, ICommandComponent> {
    public isReady = false;
    public readonly categories: Collection<string, ICategoryMeta> = new Collection();
    public readonly aliases: Collection<string, string> = new Collection();
    private readonly cooldowns: Collection<string, Collection<Snowflake, number>> = new Collection();

    public constructor(public client: Disc, private readonly path: string) { super(); }

    public load(): void {
        fs.readdir(resolve(this.path))
            .then(async categories => {
                this.client.logger.info(`Found ${categories.length} categories, registering...`);
                for (const category of categories) {
                    const meta = await import(resolve(this.path, category, "category.meta.js")) as ICategoryMeta;

                    this.categories.set(category, meta);
                    this.client.logger.info(`Registering ${category} category...`);

                    await fs.readdir(resolve(this.path, category))
                        .then(files => files.filter(f => f !== "category.meta.js"))
                        .then(async files => {
                            let disabledCount = 0;

                            this.client.logger.info(`Found ${files.length} of commands in ${category}, loading...`);
                            const allCmd = await this.client.application!.commands.fetch();

                            for (const file of files) {
                                try {
                                    const path = resolve(this.path, category, file);

                                    const command = await this.client.utils.import<ICommandComponent>(path, this.client, { category, path });
                                    if (command === undefined) throw new Error(`File ${file} is not a valid command file.`);

                                    command.meta = Object.assign(command.meta, { path, category });
                                    if (Number(command.meta.aliases?.length) > 0) command.meta.aliases?.forEach(alias => this.aliases.set(alias, command.meta.name));
                                    this.set(command.meta.name, command);

                                    if (command.meta.contextChat) {
                                        if (this.client.config.isDev) {
                                            for (const guild of this.client.config.devGuild) {
                                                const g = await this.client.guilds.fetch({ guild });

                                                await g.commands.create({
                                                    name: command.meta.contextChat,
                                                    type: "MESSAGE"
                                                })
                                                    .catch(() => this.client.logger.info(`Missing access on ${guild} [MESSAGE_CTX]`));
                                                this.client.logger.info(`Registered ${command.meta.name} to message context for ${guild}`);
                                            }
                                        } else {
                                            await this.client.application!.commands.create({
                                                name: command.meta.contextChat,
                                                type: "MESSAGE"
                                            });
                                            this.client.logger.info(`Registered ${command.meta.name} to message context for global.`);
                                        }
                                    }
                                    if (command.meta.contextUser) {
                                        if (this.client.config.isDev) {
                                            for (const guild of this.client.config.devGuild) {
                                                const g = await this.client.guilds.fetch({ guild });

                                                await g.commands.create({
                                                    name: command.meta.contextUser,
                                                    type: "USER"
                                                })
                                                    .catch(() => this.client.logger.info(`Missing access on ${guild} [USER_CTX]`));
                                                this.client.logger.info(`Registered ${command.meta.name} to user context for ${guild}`);
                                            }
                                        } else {
                                            await this.client.application!.commands.create({
                                                name: command.meta.contextUser,
                                                type: "USER"
                                            });
                                            this.client.logger.info(`Registered ${command.meta.name} to user context for global.`);
                                        }
                                    }
                                    if (!allCmd.has(command.meta.name) && command.meta.slash && this.client.config.enableSlashCommand) {
                                        if (!command.meta.slash.name) Object.assign(command.meta.slash, { name: command.meta.name });
                                        if (!command.meta.slash.description) Object.assign(command.meta.slash, { description: command.meta.description });

                                        if (this.client.config.isDev) {
                                            for (const guild of this.client.config.devGuild) {
                                                const g = await this.client.guilds.fetch({ guild });
                                                await g.commands.create(command.meta.slash as ApplicationCommandData)
                                                    .catch(() => this.client.logger.info(`Missing access on ${guild} [SLASH_COMMAND]`));
                                                this.client.logger.info(`Registered ${command.meta.name} to slash command for ${guild}`);
                                            }
                                        } else {
                                            await this.client.application!.commands.create(command.meta.slash as ApplicationCommandData);
                                            this.client.logger.info(`Registered ${command.meta.name} to slash command for global.`);
                                        }
                                    }
                                    this.client.logger.info(`Command ${command.meta.name} from ${category} category is now loaded.`);
                                    if (command.meta.disable) disabledCount++;
                                } catch (err) {
                                    this.client.logger.error(`Error occured while loading ${file}: ${(err as Error).message}`);
                                }
                            }
                            return { disabledCount, files };
                        })
                        .then(data => {
                            this.categories.set(category, Object.assign(meta, { cmds: this.filter(({ meta }) => meta.category === category) }));
                            this.client.logger.info(`Done loading ${data.files.length} commands in ${category} category.`);
                            if (data.disabledCount !== 0) this.client.logger.info(`${data.disabledCount} out of ${data.files.length} commands in ${category} category is disabled.`);
                        })
                        .catch(err => this.client.logger.error("CMD_LOADER_ERR:", err))
                        .finally(() => this.client.logger.info(`Done registering ${category} category.`));
                }
            })
            .catch(err => this.client.logger.error("CMD_LOADER_ERR:", err))
            .finally(() => {
                this.client.logger.info("All categories has been registered.");
                this.client.logger.info(`Current bot language is ${this.client.config.lang.toUpperCase()}`);
                this.isReady = true;
            });
    }

    public async handle(message: Message, pref: string): Promise<void> {
        const prefix = pref === "{mention}" ? /<@(!)?\d*?>/.exec(message.content)![0] : pref;
        const args = message.content.substring(prefix.length).trim().split(/ +/);
        const cmd = args.shift()?.toLowerCase();
        const command = this.get(cmd!) ?? this.get(this.aliases.get(cmd!)!);
        if (!command || command.meta.disable) return;
        if (!this.cooldowns.has(command.meta.name)) this.cooldowns.set(command.meta.name, new Collection());
        const now = Date.now();
        const timestamps = this.cooldowns.get(command.meta.name);
        const cooldownAmount = (command.meta.cooldown ?? 3) * 1000;
        if (timestamps?.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id)! + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                message.channel.send({ embeds: [createEmbed("warn", `⚠️ **|** ${i18n.__mf("utils.cooldownMessage", { author: message.author.toString(), timeleft: timeLeft.toFixed(1) })}`, true)] }).then(msg => {
                    void msg.delete().then(m => setTimeout(() => m.delete().catch(e => this.client.logger.error("PROMISE_ERR:", e)), 3500));
                }).catch(e => this.client.logger.error("PROMISE_ERR:", e));
                return;
            }

            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        } else {
            timestamps?.set(message.author.id, now);
            if (this.client.config.owners.includes(message.author.id)) timestamps?.delete(message.author.id);
        }
        try {
            if (command.meta.devOnly && !this.client.config.owners.includes(message.author.id)) return undefined;
            command.execute(new CommandContext(message, args));
        } catch (e) {
            this.client.logger.error("COMMAND_HANDLER_ERR:", e);
        } finally {
            // eslint-disable-next-line no-unsafe-finally
            if (command.meta.devOnly && !this.client.config.owners.includes(message.author.id)) return undefined;
            this.client.logger.info(
                `${message.author.tag} [${message.author.id}] is using ${command.meta.name} command from ${command.meta.category!} category ` +
                `on #${(message.channel as TextChannel).name} [${message.channel.id}] in guild: ${message.guild!.name} [${message.guild!.id}]`
            );
        }
    }
}
