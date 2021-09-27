import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { LoopMode } from "../../typings";
import { createEmbed } from "../../utils/createEmbed";

@DefineCommand({
    aliases: ["loop", "music-repeat", "music-loop"],
    description: "Repeat current music or the queue",
    name: "repeat",
    slash: {
        options: [
            {
                description: "Set repeat mode to Queue",
                name: "queue",
                required: false,
                type: "SUB_COMMAND"
            },
            {
                description: "Set repeat mode to Song",
                name: "song",
                required: false,
                type: "SUB_COMMAND"
            },
            {
                description: "Disable repeat mode",
                name: "disable",
                required: false,
                type: "SUB_COMMAND"
            }
        ]
    },
    usage: "{prefix}repeat [queue/all | song/one | disable/off]"
})
export class RepeatCommand extends BaseCommand {
    @inVC()
    @haveQueue()
    @sameVC()
    public execute(ctx: CommandContext): any {
        const mode: Record<LoopMode, { aliases: string[]; emoji: string }> = {
            OFF: {
                aliases: ["disable", "off"],
                emoji: "▶"
            },
            QUEUE: {
                aliases: ["all", "queue"],
                emoji: "🔁"
            },
            SONG: {
                aliases: ["one", "song"],
                emoji: "🔂"
            }
        };
        const selection = Object.keys(mode).find(key => mode[key as LoopMode].aliases.includes(ctx.args[0] ?? ctx.options!.getSubcommand()));

        if (!selection) return ctx.reply({ embeds: [createEmbed("info", `${mode[ctx.guild!.queue!.loopMode].emoji} **|** Current repeat mode is **\`${ctx.guild!.queue!.loopMode}\`**`)] });
        ctx.guild!.queue!.loopMode = selection as LoopMode;

        return ctx.reply({ embeds: [createEmbed("info", `${mode[ctx.guild!.queue!.loopMode].emoji} **|** The repeat mode has been set to **\`${ctx.guild!.queue!.loopMode}\`**`)] });
    }
}
