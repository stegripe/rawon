import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { play } from "../../utils/handlers/GeneralUtil";
import { createEmbed } from "../../utils/createEmbed";
import { IQueueSong } from "../../typings";
import { AudioPlayerPlayingState } from "@discordjs/voice";

@DefineCommand({
    aliases: [],
    description: "Skip to specific position in the queue",
    name: "skipto",
    slash: {
        options: [
            {
                description: "Rewind to the first song in the queue",
                name: "first",
                type: "SUB_COMMAND"
            },
            {
                description: "Skip to the last song in the queue",
                name: "last",
                type: "SUB_COMMAND"
            },
            {
                description: "Skip to a specific position in the queue",
                name: "specific",
                options: [
                    {
                        description: "Song position in the queue",
                        name: "position",
                        required: true,
                        type: "NUMBER"
                    }
                ],
                type: "SUB_COMMAND"
            }
        ]
    },
    usage: "{prefix}skipto <\"first\"|\"last\"|number>"
})
export class SkipToCommand extends BaseCommand {
    @inVC()
    @haveQueue()
    @sameVC()
    public execute(ctx: CommandContext): any {
        const targetType = (ctx.args[0] as string|undefined) ?? ctx.options?.getSubcommand() ?? ctx.options?.getNumber("position");
        if (!targetType) return ctx.reply({ embeds: [createEmbed("warn", `Invalid usage, please use **\`${this.client.config.prefix}help ${this.meta.name}\`** for more information.`)] });

        const songs = [...ctx.guild!.queue!.songs.sortByIndex().values()];
        if (!["first", "last"].includes(String(targetType).toLowerCase()) && (!isNaN(Number(targetType)) && !songs[Number(targetType) - 1])) return ctx.reply({ embeds: [createEmbed("error", "Unable to find song in that position.", true)] });

        let song: IQueueSong;
        if (String(targetType).toLowerCase() === "first") {
            song = songs[0];
        } else if (String(targetType).toLowerCase() === "last") {
            song = songs[songs.length - 1];
        } else {
            song = songs[Number(targetType) - 1];
        }

        if (song.key === ((ctx.guild!.queue!.player!.state as AudioPlayerPlayingState).resource.metadata as IQueueSong).key) return ctx.reply({ embeds: [createEmbed("error", "You can't skip to current music.", true)] });

        void play(this.client, ctx.guild!, song.key);

        return ctx.reply({ embeds: [createEmbed("info", `⏭ **|** Skipped to **[${song.song.title}](${song.song.url})**`).setThumbnail(song.song.thumbnail)] });
    }
}
