import { BaseCommand } from "../structures/BaseCommand";
import { IMessage } from "../../typings";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { isUserInTheVoiceChannel, isMusicPlaying, isSameVoiceChannel } from "../utils/decorators/MusicHelper";
import { createEmbed } from "../utils/createEmbed";

@DefineCommand({
    aliases: ["vol", "v"],
    name: "volume",
    description: "Show or set the music player volume",
    usage: "{prefix}volume [level]"
})
export class VolumeCommand extends BaseCommand {
    @isUserInTheVoiceChannel()
    @isMusicPlaying()
    @isSameVoiceChannel()
    public execute(message: IMessage, args: string[]): any {
        let volume = Number(args[0]);

        if (isNaN(volume)) return message.channel.send(createEmbed("info", `🔊  **|**  The music player volume is **\`${message.guild!.queue!.volume.toString()}\`**`));

        if (volume < 0) volume = 0;
        if (volume === 0) return message.channel.send(createEmbed("warn", "Please pause the music player instead of setting the volume to **\`0\`**"));
        if (Number(args[0]) > this.client.config.maxVolume) {
            return message.channel.send(
                createEmbed("error", `You cannot set the volume above **\`${this.client.config.maxVolume}\`**`)
            );
        }

        message.guild!.queue!.volume = Number(args[0]);
        message.guild!.queue!.connection?.dispatcher.setVolume(Number(args[0]) / this.client.config.maxVolume);
        message.channel.send(createEmbed("info", `🔊  **|**  Volume set to **\`${args[0]}\`**`)).catch(console.error);
    }
}
