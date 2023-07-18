/* eslint-disable max-depth */
import { CategoryMeta, CommandComponent, RegisterCmdOptions } from "../../typings/index.js";
import { pathStringToURLString } from "../functions/pathStringToURLString.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../functions/createEmbed.js";
import { Rawon } from "../../structures/Rawon.js";
import i18n from "../../config/index.js";
import { ApplicationCommandData, ApplicationCommandType, Collection, Guild, Message, Snowflake, TextChannel } from "discord.js";
import { promises as fs } from "node:fs";
import { resolve } from "node:path";

export class CommandManager extends Collection<string, CommandComponent> {
    public isReady = false;
    public readonly categories = new Collection<string, CategoryMeta>();
    public readonly aliases = new Collection<string, string>();
    private readonly cooldowns = new Collection<string, Collection<Snowflake, number>>();

    public constructor(public client: Rawon, private readonly path: string) {
        super();
    }

    public async load(): Promise<void> {
        try {
            const categories = await fs.readdir(resolve(this.path));
            this.client.logger.info(`Found ${categories.length} categories, registering...`);

            for (const category of categories) {
                try {
                    const meta = (
                        await import(
                            pathStringToURLString(resolve(this.path, category, "category.meta.js"))
                        ) as { default: CategoryMeta }
                    ).default;

                    this.categories.set(category, meta);
                    this.client.logger.info(`Registering ${category} category...`);

                    const files = (await fs.readdir(resolve(this.path, category)))
                        .filter(f => f !== "category.meta.js");

                    let disabledCount = 0;

                    this.client.logger.info(`Found ${files.length} of commands in ${category}, loading...`);
                    const allCmd = await this.client.application!.commands.fetch();

                    for (const file of files) {
                        try {
                            const path = pathStringToURLString(resolve(this.path, category, file));
                            const command = await this.client.utils.import<CommandComponent>(path, this.client);

                            if (command === undefined)
                                throw new Error(`File ${file} is not a valid command file.`);

                            command.meta = Object.assign(command.meta, { path, category });
                            if (Number(command.meta.aliases?.length) > 0) {
                                for (const alias of command.meta.aliases ?? []) {
                                    this.aliases.set(alias, command.meta.name);
                                }
                            }
                            this.set(command.meta.name, command);

                            if (command.meta.contextChat) {
                                await this.registerCmd(
                                    {
                                        name: command.meta.contextChat,
                                        type: ApplicationCommandType.Message
                                    },
                                    {
                                        onError: (g, err) =>
                                            this.client.logger.error(
                                                `Unable to register ${command.meta.name
                                                } to message context for ${g?.id ?? "???"}, reason: ${err.message
                                                }`
                                            ),
                                        onRegistered: g =>
                                            this.client.logger.info(
                                                `Registered ${command.meta.name} to message context for ${g.id}`
                                            )
                                    }
                                );
                                if (!this.client.config.isDev)
                                    this.client.logger.info(
                                        `Registered ${command.meta.name} to message context for global.`
                                    );
                            }
                            if (command.meta.contextUser) {
                                await this.registerCmd(
                                    {
                                        name: command.meta.contextUser,
                                        type: ApplicationCommandType.User
                                    },
                                    {
                                        onError: (g, err) =>
                                            this.client.logger.error(
                                                `Unable to register ${command.meta.name} to user context for ${g?.id ?? "???"
                                                }, reason: ${err.message}`
                                            ),
                                        onRegistered: g =>
                                            this.client.logger.info(
                                                `Registered ${command.meta.name} to user context for ${g.id}`
                                            )
                                    }
                                );
                                if (!this.client.config.isDev)
                                    this.client.logger.info(
                                        `Registered ${command.meta.name} to user context for global.`
                                    );
                            }
                            if (
                                !allCmd.has(command.meta.name) &&
                                command.meta.slash &&
                                this.client.config.enableSlashCommand
                            ) {
                                if (!command.meta.slash.name) {
                                    Object.assign(command.meta.slash, {
                                        name: command.meta.name
                                    });
                                }
                                if (!command.meta.slash.description) {
                                    Object.assign(command.meta.slash, {
                                        description: command.meta.description
                                    });
                                }

                                await this.registerCmd(command.meta.slash as ApplicationCommandData, {
                                    onError: (g, err) =>
                                        this.client.logger.error(
                                            `Unable to register ${command.meta.name} to slash command for ${g?.id ?? "???"
                                            }, reason: ${err.message}`
                                        ),
                                    onRegistered: g =>
                                        this.client.logger.info(
                                            `Registered ${command.meta.name} to slash command for ${g.id}`
                                        )
                                });
                                if (!this.client.config.isDev)
                                    this.client.logger.info(
                                        `Registered ${command.meta.name} to slash command for global.`
                                    );
                            }
                            this.client.logger.info(
                                `Command ${command.meta.name} from ${category} category is now loaded.`
                            );
                            if (command.meta.disable) disabledCount++;
                        } catch (err) {
                            this.client.logger.error(
                                `Error occured while loading ${file}: ${(err as Error).message}`
                            );
                        }
                    }

                    this.categories.set(
                        category,
                        Object.assign(meta, {
                            cmds: this.filter(c => c.meta.category === category)
                        })
                    );

                    this.client.logger.info(
                        `Done loading ${files.length} commands in ${category} category.`
                    );

                    if (disabledCount > 0) {
                        this.client.logger.info(
                            `${disabledCount} out of ${files.length} commands in ${category} category is disabled.`
                        );
                    }
                } catch (err) {
                    this.client.logger.error("CMD_LOADER_ERR:", err);
                } finally {
                    this.client.logger.info(`Done registering ${category} category.`)
                }
            }
        } catch (err) {
            this.client.logger.error("CMD_LOADER_ERR:", err)
        } finally {
            this.client.logger.info("All categories has been registered.");
            this.client.logger.info(`Current bot language is ${this.client.config.lang.toUpperCase()}`);
            this.isReady = true;
        }
    }

    public handle(message: Message, pref: string): void {
        // eslint-disable-next-line prefer-named-capture-group
        const prefix = pref === "{mention}" ? /<@(!)?\d*?>/.exec(message.content)![0] : pref;
        const args = message.content.substring(prefix.length).trim().split(/ +/);
        const cmd = args.shift()?.toLowerCase();
        const command = this.get(cmd!) ?? this.get(this.aliases.get(cmd!)!);

        this.client.debugLog.logData("info", "COMMAND_MANAGER_HANDLE", [
            ["Content", message.content],
            ["Prefix", pref],
            ["Cmd Name", cmd ?? "[???]"],
            ["Is Command", command === undefined ? "No" : "Yes"]
        ]);

        if (!command || command.meta.disable) return;
        if (!this.cooldowns.has(command.meta.name)) this.cooldowns.set(command.meta.name, new Collection());

        const now = Date.now();
        const timestamps = this.cooldowns.get(command.meta.name);
        const cooldownAmount = (command.meta.cooldown ?? 3) * 1000;

        if (timestamps?.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id)! + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                message.channel
                    .send({
                        embeds: [
                            createEmbed(
                                "warn",
                                `⚠️ **|** ${i18n.__mf("utils.cooldownMessage", {
                                    author: message.author.toString(),
                                    timeleft: timeLeft.toFixed(1)
                                })}`,
                                true
                            )
                        ]
                    })
                    .then(msg => {
                        setTimeout(() => msg.delete().catch(e => this.client.logger.error("PROMISE_ERR:", e)), 3500);
                    })
                    .catch(e => this.client.logger.error("PROMISE_ERR:", e));
                return;
            }

            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        } else {
            timestamps?.set(message.author.id, now);
            if (this.client.config.devs.includes(message.author.id)) timestamps?.delete(message.author.id);
        }

        try {
            if (command.meta.devOnly && !this.client.config.devs.includes(message.author.id)) return;
            command.execute(new CommandContext(message, args));
        } catch (e) {
            this.client.logger.error("COMMAND_HANDLER_ERR:", e);
        } finally {
            // eslint-disable-next-line no-unsafe-finally
            if (command.meta.devOnly && !this.client.config.devs.includes(message.author.id)) return;
            this.client.logger.info(
                `${message.author.tag} [${message.author.id}] is using ${command.meta.name} command from ${command.meta
                    .category!} category ` +
                `on #${(message.channel as TextChannel).name} [${message.channel.id}] in guild: ${message.guild!.name
                } [${message.guild!.id}]`
            );
        }
    }

    private async registerCmd(data: ApplicationCommandData, options?: RegisterCmdOptions): Promise<void> {
        if (options && this.client.config.isDev) {
            for (const id of this.client.config.mainGuild) {
                let guild: Guild | null = null;

                try {
                    guild = await this.client.guilds.fetch(id).catch(() => null);
                    if (!guild) throw new Error("Invalid Guild.");

                    await guild.commands.create(data);
                    void options.onRegistered(guild);
                } catch (err) {
                    void options.onError(guild, err as Error);
                }
            }
        } else {
            await this.client.application!.commands.create(data);
        }
    }
}
