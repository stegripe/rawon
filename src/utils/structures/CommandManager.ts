import { promises as fs } from "node:fs";
import nodePath from "node:path";
import { setTimeout } from "node:timers";
import {
    type ApplicationCommandData,
    ApplicationCommandType,
    Collection,
    type Message,
    type Snowflake,
    type TextChannel,
} from "discord.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type CategoryMeta, type CommandComponent } from "../../typings/index.js";
import { createEmbed } from "../functions/createEmbed.js";
import { i18n__mf } from "../functions/i18n.js";
import { pathStringToURLString } from "../functions/pathStringToURLString.js";

export class CommandManager extends Collection<string, CommandComponent> {
    public isReady = false;
    public readonly categories = new Collection<string, CategoryMeta>();
    public readonly aliases = new Collection<string, string>();
    private readonly cooldowns = new Collection<string, Collection<Snowflake, number>>();

    public constructor(
        public client: Rawon,
        private readonly path: string,
    ) {
        super();
    }

    public async load(): Promise<void> {
        const pendingCommands: ApplicationCommandData[] = [];

        try {
            const categories = await fs.readdir(nodePath.resolve(this.path));
            this.client.logger.info(`Found ${categories.length} categories, registering...`);

            const _allCmd = await (
                this.client.application as unknown as NonNullable<typeof this.client.application>
            ).commands.fetch();

            for (const category of categories) {
                try {
                    const meta = (
                        (await import(
                            pathStringToURLString(
                                nodePath.resolve(this.path, category, "category.meta.js"),
                            )
                        )) as { default: CategoryMeta }
                    ).default;

                    this.categories.set(category, meta);
                    this.client.logger.info(`Registering ${category} category...`);

                    const files = await fs
                        .readdir(nodePath.resolve(this.path, category))
                        .then((fls) => fls.filter((fl) => fl !== "category.meta.js"));

                    let disabledCount = 0;

                    this.client.logger.info(
                        `Found ${files.length} of commands in ${category}, loading...`,
                    );

                    for (const file of files) {
                        try {
                            const path = pathStringToURLString(
                                nodePath.resolve(this.path, category, file),
                            );
                            const command = await this.client.utils.import<CommandComponent>(
                                path,
                                this.client,
                            );

                            if (command === undefined) {
                                throw new Error(`File ${file} is not a valid command file.`);
                            }

                            command.meta = Object.assign(command.meta, { path, category });
                            if (Number(command.meta.aliases?.length) > 0) {
                                for (const alias of command.meta.aliases ?? []) {
                                    this.aliases.set(alias, command.meta.name);
                                }
                            }
                            this.set(command.meta.name, command);

                            if ((command.meta.contextChat?.length ?? 0) > 0) {
                                pendingCommands.push({
                                    name: command.meta.contextChat ?? "",
                                    type: ApplicationCommandType.Message,
                                });
                            }
                            if ((command.meta.contextUser?.length ?? 0) > 0) {
                                pendingCommands.push({
                                    name: command.meta.contextUser ?? "",
                                    type: ApplicationCommandType.User,
                                });
                            }
                            if (command.meta.slash && this.client.config.enableSlashCommand) {
                                if ((command.meta.slash.name?.length ?? 0) === 0) {
                                    Object.assign(command.meta.slash, {
                                        name: command.meta.name,
                                    });
                                }
                                if ((command.meta.slash.description?.length ?? 0) === 0) {
                                    Object.assign(command.meta.slash, {
                                        description: command.meta.description,
                                    });
                                }

                                pendingCommands.push(command.meta.slash as ApplicationCommandData);
                            }
                            this.client.logger.info(
                                `Command ${command.meta.name} from ${category} category is now loaded.`,
                            );
                            if (command.meta.disable === true) {
                                disabledCount++;
                            }
                        } catch (error) {
                            this.client.logger.error(
                                `Error occured while loading ${file}: ${(error as Error).message}`,
                            );
                        }
                    }

                    this.categories.set(
                        category,
                        Object.assign(meta, {
                            cmds: this.filter((c) => c.meta.category === category),
                        }),
                    );

                    this.client.logger.info(
                        `Done loading ${files.length} commands in ${category} category.`,
                    );

                    if (disabledCount > 0) {
                        this.client.logger.info(
                            `${disabledCount} out of ${files.length} commands in ${category} category is disabled.`,
                        );
                    }
                } catch (error) {
                    this.client.logger.error("CMD_LOADER_ERR:", error);
                } finally {
                    this.client.logger.info(`Done registering ${category} category.`);
                }
            }
        } catch (error) {
            this.client.logger.error("CMD_LOADER_ERR:", error);
        } finally {
            this.client.logger.info("All categories has been registered.");
            this.client.logger.info(
                `Current bot language is ${this.client.config.lang.toUpperCase()}`,
            );
            this.isReady = true;
        }

        if (pendingCommands.length > 0) {
            this.client.logger.info(
                `Registering ${pendingCommands.length} slash commands in background...`,
            );
            void this.registerCommandsBulk(pendingCommands);
        }
    }

    private async registerCommandsBulk(commands: ApplicationCommandData[]): Promise<void> {
        const startTime = Date.now();
        try {
            if (this.client.config.isDev) {
                for (const id of this.client.config.mainServer) {
                    try {
                        const guild = await this.client.guilds.fetch(id).catch(() => null);
                        if (!guild) {
                            this.client.logger.error(`Unable to fetch guild ${id}`);
                            continue;
                        }
                        await guild.commands.set(commands);
                        this.client.logger.info(
                            `Registered ${commands.length} commands to guild ${guild.name} [${guild.id}].`,
                        );
                    } catch (error) {
                        this.client.logger.error(`SLASH_CMD_REGISTER_ERR for guild ${id}:`, error);
                    }
                }
            } else {
                await this.client.application?.commands.set(commands);
                this.client.logger.info(`Registered ${commands.length} commands globally.`);
            }
        } catch (error) {
            this.client.logger.error("SLASH_CMD_REGISTER_ERR:", error);
        }
        const elapsed = Date.now() - startTime;
        this.client.logger.info(
            `All slash commands have been registered in background. (took ${elapsed} ms)`,
        );
    }

    public handle(message: Message, pref: string): void {
        const prefix =
            pref === "{mention}" ? (/<@(!)?\d*?>/u.exec(message.content) as string[])[0] : pref;
        const args = message.content.slice(prefix.length).trim().split(/ +/u);
        const cmd = args.shift()?.toLowerCase();
        const command = this.get(cmd ?? "") ?? this.get(this.aliases.get(cmd ?? "") ?? "");

        this.client.debugLog.logData("info", "COMMAND_MANAGER_HANDLE", [
            ["Content", message.content],
            ["Prefix", pref],
            ["Cmd Name", cmd ?? "[???]"],
            ["Is Command", command === undefined ? "No" : "Yes"],
        ]);

        if (!command || command.meta.disable === true) {
            return;
        }
        if (!this.cooldowns.has(command.meta.name)) {
            this.cooldowns.set(command.meta.name, new Collection());
        }

        const now = Date.now();
        const timestamps = this.cooldowns.get(command.meta.name);
        const cooldownAmount = (command.meta.cooldown ?? 3) * 1_000;

        if (timestamps?.has(message.author.id) === true) {
            const expirationTime =
                (timestamps.get(message.author.id) as unknown as number) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1_000;
                const msgChannel = message.channel;
                if ("send" in msgChannel) {
                    const __mf = i18n__mf(this.client, message.guild);
                    void (async () => {
                        try {
                            const sentMsg = await msgChannel.send({
                                embeds: [
                                    createEmbed(
                                        "warn",
                                        `⚠️ **|** ${__mf("utils.cooldownMessage", {
                                            author: message.author.toString(),
                                            timeleft: `**\`${timeLeft.toFixed(1)}\`**`,
                                        })}`,
                                    ),
                                ],
                            });
                            setTimeout(() => {
                                void (async () => {
                                    if ("delete" in sentMsg) {
                                        try {
                                            await sentMsg.delete();
                                        } catch (error: unknown) {
                                            this.client.logger.error("PROMISE_ERR:", error);
                                        }
                                    }
                                })();
                            }, 3_500);
                        } catch (error: unknown) {
                            this.client.logger.error("PROMISE_ERR:", error);
                        }
                    })();
                }
                return;
            }

            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        } else {
            timestamps?.set(message.author.id, now);
            if (this.client.config.devs.includes(message.author.id)) {
                timestamps?.delete(message.author.id);
            }
        }

        try {
            if (
                command.meta.devOnly === true &&
                !this.client.config.devs.includes(message.author.id)
            ) {
                return;
            }
            command.execute(new CommandContext(message, args));
        } catch (error) {
            this.client.logger.error("COMMAND_HANDLER_ERR:", error);
        } finally {
            if (
                command.meta.devOnly === true &&
                !this.client.config.devs.includes(message.author.id)
            ) {
                return;
            }
            this.client.logger.info(
                `${message.author.tag} [${message.author.id}] is using ${command.meta.name} command from ${
                    command.meta.category
                } category ` +
                    `on #${(message.channel as TextChannel).name} [${message.channel.id}] in guild: ${
                        message.guild?.name
                    } [${message.guild?.id}]`,
            );
        }
    }
}
