import { BaseCommand } from "../structures/BaseCommand";
import { IMessage } from "../../typings";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { isUserInTheVoiceChannel, isMusicPlaying, isSameVoiceChannel } from "../utils/decorators/MusicHelper";
import { createEmbed } from "../utils/createEmbed";

@DefineCommand({
    name: "skip",
    description: "Skip the current track",
    usage: "{prefix}skip"
})
export class SkipCommand extends BaseCommand {
    @isUserInTheVoiceChannel()
    @isMusicPlaying()
    @isSameVoiceChannel()
    public execute(message: IMessage): any {
        message.guild!.queue!.playing = true;
        message.guild!.queue?.connection?.dispatcher.resume();
        message.guild!.queue?.connection?.dispatcher.end();

        const song = message.guild?.queue?.songs.first();

        message.channel.send(
            createEmbed("info", `⏭  **|**  Skipped **[${message.guild?.queue!.songs.first()?.title as string}](${message.guild?.queue!.songs.first()?.url as string})**`)
                .setThumbnail(song?.thumbnail as string)
        )
            .catch(e => this.client.logger.error("SKIP_CMD_ERR:", e));
    }
}
