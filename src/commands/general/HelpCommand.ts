import { Buffer } from "node:buffer";
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ComponentType,
    type SelectMenuComponentOptionData,
    StringSelectMenuBuilder,
    type StringSelectMenuInteraction,
} from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";

@Command<typeof HelpCommand>({
    aliases: ["h", "command", "commands", "cmd", "cmds"],
    description: i18n.__("commands.general.help.description"),
    name: "help",
    slash: {
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: "command",
                description: i18n.__("commands.general.help.slashDescription"),
            },
        ],
    },
    usage: i18n.__("commands.general.help.usage"),
})
export class HelpCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) {
            await ctx.deferReply();
        }

        const __ = i18n__(this.client, ctx.guild);
        const __mf = i18n__mf(this.client, ctx.guild);

        const val =
            ctx.args[0] ??
            ctx.options?.getString("command") ??
            (ctx.additionalArgs.get("values") === undefined
                ? null
                : (ctx.additionalArgs.get("values") as string[])[0]);
        const command =
            this.client.commands.get(val) ??
            this.client.commands.get(this.client.commands.aliases.get(val) ?? "");

        if (!val) {
            const listEmbed = createEmbed("info")
                .setAuthor({
                    name: __mf("commands.general.help.authorString", {
                        username: this.client.user?.username,
                    }),
                    iconURL: this.client.user?.displayAvatarURL(),
                })
                .setFooter({
                    text: __mf("commands.general.help.footerString", {
                        prefix: this.client.config.mainPrefix,
                    }),
                    iconURL: "https://cdn.stegripe.org/images/information.png",
                })
                .setThumbnail(ctx.guild?.iconURL({ extension: "png", size: 1_024 }) ?? null);

            for (const category of this.client.commands.categories.values()) {
                const isDev = this.client.config.devs.includes(ctx.author.id);
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

            await ctx
                .send({ embeds: [listEmbed] }, "editReply")
                .catch((error: unknown) => this.client.logger.error("PROMISE_ERR:", error));
            return;
        }

        if (!command) {
            const matching = this.generateSelectMenu(val, ctx.author.id);
            if (matching.length === 0) {
                await ctx.send(
                    {
                        embeds: [createEmbed("error", __("commands.general.help.noCommand"), true)],
                    },
                    "editReply",
                );
                return;
            }

            await ctx.send(
                {
                    components: [
                        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                            new StringSelectMenuBuilder()
                                .setMinValues(1)
                                .setMaxValues(1)
                                .setCustomId(
                                    Buffer.from(`${ctx.author.id}_${this.meta.name}`).toString(
                                        "base64",
                                    ),
                                )
                                .addOptions(matching)
                                .setPlaceholder(__("commands.general.help.commandSelectionString")),
                        ),
                    ],
                    embeds: [
                        createEmbed("error", __("commands.general.help.noCommanSuggest"), true),
                    ],
                },
                "editReply",
            );
        }

        if (ctx.isStringSelectMenu()) {
            const channel = ctx.channel;
            const msg = await channel?.messages
                .fetch((ctx.context as StringSelectMenuInteraction).message.id)
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
                const disabledMenu = new StringSelectMenuBuilder()
                    .setCustomId(selection.data.customId as string)
                    .setDisabled(true)
                    .addOptions({
                        label: "Nothing to select here",
                        description: "Nothing to select here",
                        value: "Nothing to select here",
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
                    username: this.client.user?.username,
                    command: command?.meta.name,
                }),
                iconURL: this.client.user?.displayAvatarURL(),
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
                            ? (command?.meta.aliases?.map((c) => `\`${c}\``).join(", ") ?? "None.")
                            : "None.",
                    inline: false,
                },
                {
                    name: __("commands.general.help.usageString"),
                    value: `\`${command?.meta.usage?.replaceAll("{prefix}", this.client.config.mainPrefix)}\``,
                    inline: true,
                },
            ])
            .setFooter({
                text: __mf("commands.general.help.commandUsageFooter", {
                    devOnly: command?.meta.devOnly === true ? "(developer-only command)" : "",
                }),
                iconURL: "https://cdn.stegripe.org/images/information.png",
            });

        await ctx.send({ embeds: [infoEmbed] }, "editReply");
    }

    private generateSelectMenu(cmd: string, author: string): SelectMenuComponentOptionData[] {
        const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
        const matching = [...this.client.commands.values()]
            .filter((x) => {
                const isDev = this.client.config.devs.includes(author);
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
