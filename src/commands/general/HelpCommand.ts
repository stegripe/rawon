/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { Buffer } from "node:buffer";
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import {
    ActionRowBuilder,
    ComponentType,
    PermissionFlagsBits,
    type SelectMenuComponentOptionData,
    type SlashCommandBuilder,
    StringSelectMenuBuilder,
    type StringSelectMenuInteraction,
} from "discord.js";
import i18n from "../../config/index.js";
import { type CommandContext as LocalCommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";

@ApplyOptions<Command.Options>({
    name: "help",
    aliases: ["h", "command", "commands", "cmd", "cmds"],
    description: i18n.__("commands.general.help.description"),
    detailedDescription: { usage: i18n.__("commands.general.help.usage") },
    requiredClientPermissions: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
    ],
    chatInputCommand(
        builder: Parameters<NonNullable<Command.Options["chatInputCommand"]>>[0],
        opts: Parameters<NonNullable<Command.Options["chatInputCommand"]>>[1],
    ): SlashCommandBuilder {
        return builder
            .setName(opts.name ?? "help")
            .setDescription(opts.description ?? "Shows help for commands.")
            .addStringOption((opt) =>
                opt
                    .setName("command")
                    .setDescription(i18n.__("commands.general.help.slashDescription"))
                    .setRequired(false),
            ) as SlashCommandBuilder;
    },
})
export class HelpCommand extends ContextCommand {
    private getClient(ctx: CommandContext): Rawon {
        return ctx.client as Rawon;
    }

    public async contextRun(ctx: CommandContext): Promise<void> {
        const localCtx = ctx as unknown as LocalCommandContext;
        const client = this.getClient(ctx);
        if (ctx.isCommandInteraction() && !ctx.deferred) {
            await ctx.deferReply();
        }

        const __ = i18n__(client, ctx.guild);
        const __mf = i18n__mf(client, ctx.guild);

        const val =
            localCtx.args[0] ??
            localCtx.options?.getString("command") ??
            (localCtx.additionalArgs.get("values") === undefined
                ? null
                : (localCtx.additionalArgs.get("values") as string[])[0]);
        const command =
            client.commands.get(val) ?? client.commands.get(client.commands.aliases.get(val) ?? "");

        if (!val) {
            const listEmbed = createEmbed("info")
                .setAuthor({
                    name: __mf("commands.general.help.authorString", {
                        username: client.user?.username,
                    }),
                    iconURL: client.user?.displayAvatarURL(),
                })
                .setFooter({
                    text: __mf("commands.general.help.footerString", {
                        prefix: client.config.mainPrefix,
                    }),
                    iconURL: "https://cdn.stegripe.org/images/information.png",
                })
                .setThumbnail(ctx.guild?.iconURL({ extension: "png", size: 1_024 }) ?? null);

            for (const category of client.commands.categories.values()) {
                const isDev = client.config.devs.includes(ctx.author.id);
                const cmds = category.cmds
                    .filter((c) => (isDev ? true : c.meta.devOnly !== true))
                    .map((c) => `\`${c.meta.name}\``);
                if (cmds.length === 0) {
                    continue;
                }
                if (category.hide && !isDev) {
                    continue;
                }
                listEmbed.addFields([
                    {
                        name: `**${category.name}**`,
                        value: cmds.join(", "),
                    },
                ]);
            }

            await localCtx
                .send({ embeds: [listEmbed] }, "editReply")
                .catch((error: unknown) => this.container.logger.error("PROMISE_ERR:", error));
            return;
        }

        if (!command) {
            const matching = this.generateSelectMenu(client, val, ctx.author.id);
            if (matching.length === 0) {
                await localCtx.send(
                    {
                        embeds: [createEmbed("error", __("commands.general.help.noCommand"), true)],
                    },
                    "editReply",
                );
                return;
            }

            await localCtx.send(
                {
                    components: [
                        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                            new StringSelectMenuBuilder()
                                .setMinValues(1)
                                .setMaxValues(1)
                                .setCustomId(
                                    Buffer.from(`${ctx.author.id}_${this.options.name}`).toString(
                                        "base64",
                                    ),
                                )
                                .addOptions(matching)
                                .setPlaceholder(__("commands.general.help.commandSelectionString")),
                        ),
                    ],
                    embeds: [
                        createEmbed("error", __("commands.general.help.noCommandSuggest"), true),
                    ],
                },
                "editReply",
            );
        }

        if (localCtx.isStringSelectMenu()) {
            const channel = ctx.channel;
            const msg = await channel?.messages
                .fetch((localCtx.context as unknown as StringSelectMenuInteraction).message.id)
                .catch(() => void 0);
            if (msg !== undefined && msg.components.length > 0) {
                const actionRow = msg.components[0];
                if (!("components" in actionRow)) {
                    return;
                }
                const selection = actionRow.components.find(
                    (x) => x.type === ComponentType.StringSelect,
                );
                if (selection === undefined || !("customId" in selection.data)) {
                    return;
                }
                const disabledLabel = __("commands.general.help.disabledSelection");
                const disabledMenu = new StringSelectMenuBuilder()
                    .setCustomId(selection.data.customId as string)
                    .setDisabled(true)
                    .addOptions({
                        label: disabledLabel,
                        description: disabledLabel,
                        value: disabledLabel,
                    });
                await msg.edit({
                    components: [
                        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(disabledMenu),
                    ],
                });
            }
        }

        const infoEmbed = createEmbed("info")
            .setThumbnail("https://cdn.stegripe.org/images/question_mark.png")
            .setAuthor({
                name: __mf("commands.general.help.commandDetailTitle", {
                    username: client.user?.username,
                    command: command?.meta.name,
                }),
                iconURL: client.user?.displayAvatarURL(),
            })
            .addFields([
                {
                    name: __("commands.general.help.nameString"),
                    value: `\`${command?.meta.name}\``,
                    inline: false,
                },
                {
                    name: __("commands.general.help.descriptionString"),
                    value: `${command?.meta.description}`,
                    inline: true,
                },
                {
                    name: __("commands.general.help.aliasesString"),
                    value:
                        Number(command?.meta.aliases?.length) > 0
                            ? (command?.meta.aliases?.map((c) => `\`${c}\``).join(", ") ??
                              __("commands.general.help.noAliases"))
                            : __("commands.general.help.noAliases"),
                    inline: false,
                },
                {
                    name: __("commands.general.help.usageString"),
                    value: `\`${command?.meta.usage?.replaceAll("{prefix}", client.config.mainPrefix)}\``,
                    inline: true,
                },
            ])
            .setFooter({
                text: __mf("commands.general.help.commandUsageFooter", {
                    devOnly: command?.meta.devOnly === true ? "(developer-only command)" : "",
                }),
                iconURL: "https://cdn.stegripe.org/images/information.png",
            });

        await localCtx.send({ embeds: [infoEmbed] }, "editReply");
    }

    private generateSelectMenu(
        client: Rawon,
        cmd: string,
        author: string,
    ): SelectMenuComponentOptionData[] {
        const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
        const matching = [...client.commands.values()]
            .filter((x) => {
                const isDev = client.config.devs.includes(author);
                if (isDev) {
                    return x.meta.name.includes(cmd);
                }
                return x.meta.name.includes(cmd) && x.meta.devOnly !== true;
            })
            .slice(0, 10)
            .map((x, i) => ({
                label: x.meta.name,
                emoji: emojis[i],
                description:
                    (x.meta.description?.length ?? 0) > 47
                        ? `${x.meta.description?.slice(0, 47)}...`
                        : x.meta.description,
                value: x.meta.name,
            }));
        return matching;
    }
}
