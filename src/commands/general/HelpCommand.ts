/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain, @typescript-eslint/no-unnecessary-condition */
import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import i18n from "../../config/index.js";
import { ActionRowBuilder, ApplicationCommandOptionType, ComponentType, Message, SelectMenuComponentOptionData, StringSelectMenuBuilder, StringSelectMenuInteraction } from "discord.js";

@Command<typeof HelpCommand>({
    aliases: ["h", "command", "commands", "cmd", "cmds"],
    description: i18n.__("commands.general.help.description"),
    name: "help",
    slash: {
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: "command",
                description: i18n.__("commands.general.help.slashDescription")
            }
        ]
    },
    usage: i18n.__("commands.general.help.usage")
})
export class HelpCommand extends BaseCommand {
    private readonly listEmbed = createEmbed("info")
        .setAuthor({
            name: i18n.__mf("commands.general.help.authorString", {
                username: this.client.user!.username
            }),
            iconURL: this.client.user?.displayAvatarURL()!
        })
        .setFooter({
            text: i18n.__mf("commands.general.help.footerString", {
                prefix: this.client.config.mainPrefix
            }),
            iconURL: "https://cdn.clytage.org/images/information.png"
        });

    private readonly infoEmbed = createEmbed("info").setThumbnail(
        "https://cdn.clytage.org/images/question_mark.png"
    );

    public async execute(ctx: CommandContext): Promise<Message | undefined> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        this.infoEmbed.data.fields = [];
        const val =
            ctx.args[0] ??
            ctx.options?.getString("command") ??
            (ctx.additionalArgs.get("values") ? (ctx.additionalArgs.get("values") as string[])[0] : null);
        const command =
            this.client.commands.get(val) ?? this.client.commands.get(this.client.commands.aliases.get(val)!);
        if (!val) {
            const embed = this.listEmbed.setThumbnail(ctx.guild!.iconURL({ extension: "png", size: 1024 }));

            this.listEmbed.data.fields = [];
            for (const category of this.client.commands.categories.values()) {
                const isDev = this.client.config.devs.includes(ctx.author.id);
                const cmds = category.cmds.filter(c => (isDev ? true : !c.meta.devOnly)).map(c => `\`${c.meta.name}\``);
                if (cmds.length === 0) continue;
                if (category.hide && !isDev) continue;
                embed.addFields([
                    {
                        name: `**${category.name}**`,
                        value: cmds.join(", ")
                    }
                ]);
            }

            ctx.send({ embeds: [embed] }, "editReply").catch(e => this.client.logger.error("PROMISE_ERR:", e));
            return;
        }
        if (!command) {
            const matching = this.generateSelectMenu(val, ctx.author.id);
            if (!matching.length) {
                return ctx.send(
                    {
                        embeds: [createEmbed("error", i18n.__("commands.general.help.noCommand"), true)]
                    },
                    "editReply"
                );
            }

            return ctx.send(
                {
                    components: [
                        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                            new StringSelectMenuBuilder()
                                .setMinValues(1)
                                .setMaxValues(1)
                                .setCustomId(Buffer.from(`${ctx.author.id}_${this.meta.name}`).toString("base64"))
                                .addOptions(matching)
                                .setPlaceholder(i18n.__("commands.general.help.commandSelectionString"))
                        )
                    ],
                    embeds: [createEmbed("error", i18n.__("commands.general.help.noCommanSuggest"), true)]
                },
                "editReply"
            );
        }

        if (ctx.isStringSelectMenu()) {
            const channel = ctx.channel;
            const msg = await channel!.messages
                .fetch((ctx.context as StringSelectMenuInteraction).message.id)
                .catch(() => undefined);
            if (msg !== undefined) {
                const selection = msg.components[0].components.find(x => x.type === ComponentType.StringSelect);
                if (!selection) return;
                const disabledMenu = new StringSelectMenuBuilder()
                    .setCustomId(selection.customId!)
                    .setDisabled(true)
                    .addOptions({
                        label: "Nothing to select here",
                        description: "Nothing to select here",
                        value: "Nothing to select here"
                    });
                await msg.edit({ components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(disabledMenu)] });
            }
        }

        return ctx.send(
            {
                embeds: [
                    this.infoEmbed
                        .setAuthor({
                            name: i18n.__mf("commands.general.help.commandDetailTitle", {
                                username: this.client.user!.username,
                                command: command.meta.name
                            }),
                            iconURL: this.client.user?.displayAvatarURL()!
                        })
                        .addFields([
                            {
                                name: i18n.__("commands.general.help.nameString"),
                                value: `**\`${command.meta.name}\`**`,
                                inline: false
                            },
                            {
                                name: i18n.__("commands.general.help.descriptionString"),
                                value: `${command.meta.description!}`,
                                inline: true
                            },
                            {
                                name: i18n.__("commands.general.help.aliasesString"),
                                value:
                                    Number(command.meta.aliases?.length) > 0
                                        ? command.meta.aliases?.map(c => `**\`${c}\`**`).join(", ")!
                                        : "None.",
                                inline: false
                            },
                            {
                                name: i18n.__("commands.general.help.usageString"),
                                value: `**\`${command.meta.usage!.replace(
                                    /{prefix}/g,
                                    this.client.config.mainPrefix
                                )}\`**`,
                                inline: true
                            }
                        ])
                        .setFooter({
                            text: i18n.__mf("commands.general.help.commandUsageFooter", {
                                devOnly: command.meta.devOnly ? "(developer-only command)" : ""
                            }),
                            iconURL: "https://cdn.clytage.org/images/information.png"
                        })
                ]
            },
            "editReply"
        );
    }

    private generateSelectMenu(cmd: string, author: string): SelectMenuComponentOptionData[] {
        const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
        const matching = [...this.client.commands.values()]
            .filter(x => {
                const isDev = this.client.config.devs.includes(author);
                if (isDev) return x.meta.name.includes(cmd);
                return x.meta.name.includes(cmd) && !x.meta.devOnly;
            })
            .slice(0, 10)
            .map((x, i) => ({
                label: x.meta.name,
                emoji: emojis[i],
                description:
                    x.meta.description!.length > 47 ? `${x.meta.description!.slice(0, 47)}...` : x.meta.description!,
                value: x.meta.name
            }));
        return matching;
    }
}
