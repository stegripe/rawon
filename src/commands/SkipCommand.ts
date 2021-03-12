import { BaseCommand } from "../structures/BaseCommand";
import { IMessage } from "../../typings";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { isUserInTheVoiceChannel, isMusicPlaying, isSameVoiceChannel } from "../utils/decorators/MusicHelper";
import { createEmbed } from "../utils/createEmbed";

@DefineCommand({
    aliases: ["s"],
    name: "skip",
    description: "Skip the current music",
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
            createEmbed("info", `⏭ **|** Skipped **[${song!.title}](${song!.url}})**`)
                .setThumbnail(song?.thumbnail as string)
        ).catch(e => this.client.logger.error("SKIP_CMD_ERR:", e));
    }
}
