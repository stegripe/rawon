import { isMusicQueueExists, isSameVoiceChannel, isUserInTheVoiceChannel } from "../utils/decorators/MusicHelper";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { BaseCommand } from "../structures/BaseCommand";
import { createEmbed } from "../utils/createEmbed";
import { Message } from "discord.js";

@DefineCommand({
    aliases: ["s"],
    description: "Skip the current music",
    name: "skip",
    usage: "{prefix}skip"
})
export class SkipCommand extends BaseCommand {
    @isUserInTheVoiceChannel()
    @isMusicQueueExists()
    @isSameVoiceChannel()
    public execute(message: Message): any {
        if (message.guild?.queue?.playing === false) message.guild.queue.currentPlayer?.unpause();
        message.guild!.queue?.currentPlayer!.stop();

        const song = message.guild?.queue?.songs.first();

        message.channel.send({
            embeds: [
                createEmbed("info", `⏭ **|** Skipped **[${song!.title}](${song!.url}})**`)
                    .setThumbnail(song?.thumbnail as string)
            ]
        }).catch(e => this.client.logger.error("SKIP_CMD_ERR:", e));
    }
}
