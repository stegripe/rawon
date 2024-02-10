import { CategoryMeta, CommandComponent, RegisterCmdOptions } from "../../typings/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { createEmbed } from "../functions/createEmbed.js";
import { Rawon } from "../../structures/Rawon.js";
import { ApplicationCommandData, ApplicationCommandType, Collection, Message, Snowflake, TextChannel } from "discord.js";
import { resolve } from "node:path";
import { CommandContext } from "../../structures/CommandContext.js";

export class CommandManager extends Collection<string, CommandComponent> {
    public readonly categories = new Collection<string, CategoryMeta>();
    public readonly aliases = new Collection<string, string>();
    private readonly cooldowns = new Collection<string, Collection<Snowflake, number>>();

    public constructor(public readonly client: Rawon) { super(); }

    public loadComponent(category: CategoryMeta, path: string, comp: CommandComponent): void {
        comp.meta = Object.assign(comp.meta, { category: category.name, path });

        if (comp.meta.aliases?.length) {
            for (const alias of comp.meta.aliases) {
                this.aliases.set(alias, comp.meta.name);
            }
        }

        this.set(comp.meta.name, comp);
    }

    public async readFromDir(dir: string): Promise<void> {
        this.client.logger.info(`Loading commands from "${dir}"...`);
        const catFolders = this.client.utils.readDir(dir);

        this.client.logger.info(`Found ${catFolders.length} categories, registering...`);

        for (const cf of catFolders) {
            const meta = await this.client.utils.importFile<{ default: CategoryMeta }>(
                resolve(dir, cf, "category.meta.js")
            ).then(x => x.default);
            let disabled = 0;

            this.client.logger.info(`Registering category "${meta.name}"...`);
            meta.cmds = [];

            const files = this.client.utils.readDir(resolve(dir, cf)).filter(x => x !== "category.meta.js");

            for (const file of files) {
                try {
                    const path = resolve(dir, cf, file);
                    const command = await this.client.utils.importClass<BaseCommand>(path, this.client);

                    if (!command) throw new Error(`File "${file}" is not a valid command file`);
                    if (this.has(command.meta.name)) throw new Error(`Command "${command.meta.name}" has already been registered`);

                    this.loadComponent(meta, path, command);

                    if (command.meta.slash && this.client.config.enableSlashCommand) {
                        command.meta.slash = Object.assign(command.meta.slash, {
                            name: command.meta.slash.name ?? command.meta.name,
                            description: command.meta.slash.description ?? command.meta.description
                        });

                        await this.registerCmd(command, {
                            onError: (g, e, t) => this.client.logger.error(
                                e, "Unable to register %s to %s command for %s", command.meta.name, t, g?.id ?? "???"
                            ),
                            onRegistered: (g, t) => this.client.logger.info(
                                "Registered %s to %s command for %s", command.meta.name, t, g?.id ?? "global"
                            )
                        });
                    }

                    meta.cmds.push(command.meta.name);
                    this.client.logger.info(`Command ${command.meta.name} from ${cf} category is now loaded.`);
                    if (command.meta.disable) disabled++;
                } catch (err) {
                    this.client.logger.error(
                        `Error occured while loading ${file}: ${(err as Error).message}`
                    );
                }
            }

            this.categories.set(cf, meta);

            if (disabled) {
                this.client.logger.info(`${disabled} out of ${files.length} commands in ${cf} category is disabled"`);
            }

            this.client.logger.info(`Done registering ${cf} category.`);
        }
    }

    public handle(message: Message): void {
        const args = message.content.slice(this.client.config.prefix.length).trim().split(/\s+/);
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

                message.reply({
                    embeds: [
                        createEmbed(
                            "warn",
                            `${message.author.toString()}, please wait **\`${timeLeft.toFixed(1)}\`** of cooldown time.`
                        )
                    ]
                }).then(msg => {
                    setTimeout(() => msg.delete(), 3500);
                }).catch(e => this.client.logger.error("PROMISE_ERR:", e));

                return;
            }

            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        } else {
            timestamps?.set(message.author.id, now);
            if (this.client.config.devs.includes(message.author.id)) timestamps?.delete(message.author.id);
        }

        if (command.meta.devOnly && !this.client.config.devs.includes(message.author.id)) return;

        try {
            command.execute(new CommandContext(message, args));
        } catch (err) {
            this.client.logger.error(err, "COMMAND_HANDLER_ERR:");
        } finally {
            this.client.logger.info(
                `${message.author.tag} [${message.author.id}] is using ${command.meta.name} [${command.meta.category!}] command ` +
                `on #${(message.channel as TextChannel).name} [${message.channel.id}] channel in ${message.guild!.name} [${message.guild!.id}] guild.`
            );
        }
    }

    private async registerDiscordCmd(cmd: BaseCommand, options: RegisterCmdOptions<true>): Promise<void> {
        const manager = options.guild ? options.guild.commands : this.client.application!.commands;

        if (cmd.meta.contextChat) {
            await manager.create({
                name: cmd.meta.name,
                type: ApplicationCommandType.Message
            }).catch(err => options.onError(options.guild ?? null, err as Error, "message"));
        }

        if (cmd.meta.contextUser) {
            await manager.create({
                name: cmd.meta.name,
                type: ApplicationCommandType.User
            }).catch(err => options.onError(options.guild ?? null, err as Error, "user"));
        }

        if (cmd.meta.slash) {
            await manager.create(cmd.meta.slash as ApplicationCommandData).catch(err => options.onError(options.guild ?? null, err as Error, "slash"));
        }
    }

    private async registerCmd(data: BaseCommand, options: RegisterCmdOptions): Promise<void> {
        if (this.client.config.isDev) {
            for (const id of this.client.config.devGuild) {
                const guild = await this.client.guilds.fetch(id).catch(() => null);
                if (!guild) {
                    options.onError(null, new Error("Invalid Guild"), "slash");
                    return;
                }

                await this.registerDiscordCmd(data, { ...options, guild });
            }
        } else {
            await this.registerDiscordCmd(data, { ...options, guild: undefined });
        }
    }
}
