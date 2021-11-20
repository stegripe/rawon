/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import i18n from "../../config";
import { Message, MessageActionRow, MessageSelectMenu, MessageSelectOptionData, SelectMenuInteraction } from "discord.js";

export class HelpCommand extends BaseCommand {
    private readonly listEmbed = createEmbed("info")
        .setAuthor(i18n.__mf("commands.general.help.authorString", { username: this.client.user!.username }), this.client.user?.displayAvatarURL() as string)
        .setFooter(i18n.__mf("commands.general.help.footerString", { prefix: this.client.config.mainPrefix }), "https://raw.githubusercontent.com/zhycorp/disc-11/main/.github/images/info.png");

    private readonly infoEmbed = createEmbed("info")
        .setThumbnail("https://raw.githubusercontent.com/zhycorp/disc-11/main/.github/images/question_mark.png");

    public constructor(client: BaseCommand["client"]) {
        super(client, {
            aliases: ["h", "command", "commands", "cmd", "cmds"],
            description: i18n.__("commands.general.help.description"),
            name: "help",
            slash: {
                options: [
                    {
                        type: "STRING",
                        name: "command",
                        description: i18n.__("commands.general.help.slashDescription")
                    }
                ]
            },
            usage: i18n.__("commands.general.help.usage")
        });
    }

    public async execute(ctx: CommandContext): Promise<Message|void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        this.infoEmbed.fields = [];
        const val = ctx.args[0] ?? ctx.options?.getString("command") ?? (ctx.additionalArgs.get("values") ? ctx.additionalArgs.get("values")[0] : null);
        const command = this.client.commands.get(val) ?? this.client.commands.get(this.client.commands.aliases.get(val)!);
        if (!val) {
            const embed = this.listEmbed
                .setThumbnail(ctx.guild!.iconURL({ dynamic: true, format: "png", size: 2048 })!);
            this.listEmbed.fields = [];
            for (const category of [...this.client.commands.categories.values()]) {
                const isDev = this.client.config.owners.includes(ctx.author.id);
                const cmds = category.cmds.filter(c => isDev ? true : !c.meta.devOnly).map(c => `\`${c.meta.name}\``);
                if (cmds.length === 0) continue;
                if (category.hide && !isDev) continue;
                embed.addField(`**${category.name}**`, cmds.join(", "));
            }
            return ctx.send({ embeds: [embed] }, "editReply").catch(e => {
                this.client.logger.error("PROMISE_ERR:", e);
            });
        }
        if (!command) {
            const matching = this.generateSelectMenu(val, ctx.author.id);
            if (!matching.length) {
                return ctx.send({
                    embeds: [
                        createEmbed("error", i18n.__("commands.general.help.noCommand"), true)
                    ]
                }, "editReply");
            }
            return ctx.send({
                components: [
                    new MessageActionRow()
                        .addComponents(
                            new MessageSelectMenu()
                                .setMinValues(1)
                                .setMaxValues(1)
                                .setCustomId(Buffer.from(`${ctx.author.id}_${this.meta.name}`).toString("base64"))
                                .addOptions(matching)
                                .setPlaceholder(i18n.__("commands.general.help.commandSelectionString"))
                        )
                ],
                embeds: [createEmbed("error", i18n.__("commands.general.help.noCommanSuggest"), true)]
            }, "editReply");
        }
        // Disable selection menu
        if (ctx.isSelectMenu()) {
            const channel = await ctx.channel;
            const msg = await channel!.messages.fetch((ctx.context as SelectMenuInteraction).message.id).catch(() => undefined);
            if (msg !== undefined) {
                const selection = msg.components[0].components.find(x => x.type === "SELECT_MENU");
                selection!.setDisabled(true);
                await msg.edit({ components: [new MessageActionRow().addComponents(selection!)] });
            }
        }
        // Return information embed
        return ctx.send({
            embeds: [
                this.infoEmbed
                    .setAuthor(i18n.__mf("commands.general.help.commandDetailTitle", { username: this.client.user!.username, command: command.meta.name }), this.client.user?.displayAvatarURL() as string)
                    .addField(i18n.__("commands.general.help.nameString"), `**\`${command.meta.name}\`**`, false)
                    .addField(i18n.__("commands.general.help.descriptionString"), `${command.meta.description!}`, true)
                    .addField(i18n.__("commands.general.help.aliasesString"), Number(command.meta.aliases?.length) > 0 ? command.meta.aliases?.map(c => `**\`${c}\`**`).join(", ") as string : "None.", false)
                    .addField(i18n.__("commands.general.help.usageString"), `**\`${command.meta.usage!.replace(/{prefix}/g, this.client.config.mainPrefix)}\`**`, true)
                    .setFooter(i18n.__mf("commands.general.help.commandUsageFooter", { devOnly: command.meta.devOnly ? "(developer-only command)" : "" }), "https://raw.githubusercontent.com/zhycorp/disc-11/main/.github/images/info.png")
            ]
        }, "editReply");
    }

    private generateSelectMenu(cmd: string, author: string): MessageSelectOptionData[] {
        const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
        const matching = [...this.client.commands.values()].filter(x => {
            const isDev = this.client.config.owners.includes(author);
            if (isDev) return x.meta.name.includes(cmd);
            return x.meta.name.includes(cmd) && !x.meta.devOnly;
        }).slice(0, 10).map((x, i) => (
            {
                label: x.meta.name,
                emoji: emojis[i],
                description: x.meta.description!.length > 47 ? `${x.meta.description!.substr(0, 47)}...` : x.meta.description!,
                value: x.meta.name
            }
        ));
        return matching;
    }
}
