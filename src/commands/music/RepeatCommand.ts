import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { LoopMode } from "../../typings";
import i18n from "../../config";
import { Message } from "discord.js";

export class RepeatCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
            aliases: ["loop", "music-repeat", "music-loop"],
            description: i18n.__("commands.music.repeat.description"),
            name: "repeat",
            slash: {
                options: [
                    {
                        description: i18n.__("commands.music.repeat.slashQueue"),
                        name: "queue",
                        type: "SUB_COMMAND"
                    },
                    {
                        description: i18n.__("commands.music.repeat.slashQueue"),
                        name: "song",
                        type: "SUB_COMMAND"
                    },
                    {
                        description: i18n.__("commands.music.repeat.slashDisable"),
                        name: "disable",
                        type: "SUB_COMMAND"
                    }
                ]
            },
            usage: i18n.__("commands.music.repeat.usage", { options: "queue | one | disable" })
        });
    }

    public execute(ctx: CommandContext): Promise<Message>|void {
        if (!inVC(ctx)) return;
        if (!haveQueue(ctx)) return;
        if (!sameVC(ctx)) return;

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
                aliases: ["one", "song", "this", "1"],
                emoji: "🔂"
            }
        };
        const selection = ctx.options?.getSubcommand() || ctx.args[0] ? Object.keys(mode).find(key => mode[key as LoopMode].aliases.includes(ctx.args[0] ?? ctx.options!.getSubcommand())) : undefined;

        if (!selection) return ctx.reply({ embeds: [createEmbed("info", `${mode[ctx.guild!.queue!.loopMode].emoji} **|** ${i18n.__mf("commands.music.repeat.actualMode", { mode: `\`${ctx.guild!.queue!.loopMode}\`` })}`)] });
        ctx.guild!.queue!.loopMode = selection as LoopMode;

        return ctx.reply({ embeds: [createEmbed("success", `${mode[ctx.guild!.queue!.loopMode].emoji} **|** ${i18n.__mf("commands.music.repeat.actualMode", { mode: `\`${ctx.guild!.queue!.loopMode}\`` })}`)] });
    }
}
