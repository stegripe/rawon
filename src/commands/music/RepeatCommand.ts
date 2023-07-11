import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import { LoopMode } from "../../typings/index.js";
import i18n from "../../config/index.js";
import { ApplicationCommandOptionType, Message } from "discord.js";

@Command({
    aliases: ["loop", "music-repeat", "music-loop"],
    description: i18n.__("commands.music.repeat.description"),
    name: "repeat",
    slash: {
        options: [
            {
                description: i18n.__("commands.music.repeat.slashQueue"),
                name: "queue",
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                description: i18n.__("commands.music.repeat.slashQueue"),
                name: "song",
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                description: i18n.__("commands.music.repeat.slashDisable"),
                name: "disable",
                type: ApplicationCommandOptionType.Subcommand
            }
        ]
    },
    usage: i18n.__mf("commands.music.repeat.usage", { options: "queue | one | disable" })
})
export class RepeatCommand extends BaseCommand {
    @inVC
    @haveQueue
    @sameVC
    public execute(ctx: CommandContext): Promise<Message> | undefined {
        const mode: Record<LoopMode, { aliases: string[]; emoji: string }> = {
            OFF: {
                aliases: ["disable", "off", "0"],
                emoji: "▶"
            },
            QUEUE: {
                aliases: ["all", "queue"],
                emoji: "🔁"
            },
            SONG: {
                aliases: ["one", "song", "current", "this", "1"],
                emoji: "🔂"
            }
        };
        const selection =
            ctx.options?.getSubcommand() ?? ctx.args[0]
                ? Object.keys(mode).find(key =>
                    mode[key as LoopMode].aliases.includes(ctx.args[0] ?? ctx.options!.getSubcommand())
                )
                : undefined;

        if (!selection) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "info",
                        `${mode[ctx.guild!.queue!.loopMode].emoji} **|** ${i18n.__mf(
                            "commands.music.repeat.actualMode",
                            {
                                mode: `\`${ctx.guild!.queue!.loopMode}\``
                            }
                        )}`
                    ).setFooter({
                        text: i18n.__mf("commands.music.repeat.footer", {
                            prefix: this.client.config.mainPrefix
                        })
                    })
                ]
            });
        }
        ctx.guild!.queue!.loopMode = selection as LoopMode;

        return ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    `${mode[ctx.guild!.queue!.loopMode].emoji} **|** ${i18n.__mf("commands.music.repeat.newMode", {
                        mode: `\`${ctx.guild!.queue!.loopMode}\``
                    })}`
                )
            ]
        });
    }
}
