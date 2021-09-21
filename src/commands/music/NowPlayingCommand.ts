import { haveQueue } from "../../utils/decorators/MusicUtil";
import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { IQueueSong } from "../../typings";
import { createEmbed } from "../../utils/createEmbed";
import { AudioPlayerPlayingState } from "@discordjs/voice";

@DefineCommand({
    description: "Send information about current music player",
    name: "nowplaying",
    slash: {
        name: "nowplaying"
    },
    usage: "{prefix}nowplaying"
})
export class NowPlayingCommand extends BaseCommand {
    @haveQueue()
    public execute(ctx: CommandContext): any {
        const song = ((ctx.guild!.queue!.player!.state as AudioPlayerPlayingState).resource.metadata as IQueueSong).song;

        return ctx.reply({ embeds: [createEmbed("info", `${ctx.guild?.queue?.playing ? "▶" : "⏸"} **|** Now playing: **[${song.title}](${song.url})**`)] });
    }
}
