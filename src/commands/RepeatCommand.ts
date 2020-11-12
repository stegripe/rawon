import { BaseCommand } from "../structures/BaseCommand";
import { IMessage } from "../../typings";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { isUserInTheVoiceChannel, isMusicPlaying, isSameVoiceChannel } from "../utils/decorators/MusicHelper";
import { createEmbed } from "../utils/createEmbed";

@DefineCommand({
    aliases: ["loop", "music-repeat", "music-loop"],
    name: "repeat",
    description: "Repeat the current track or queue",
    usage: "{prefix}repeat <all | one | disable>"
})
export class RepeatCommand extends BaseCommand {
    @isUserInTheVoiceChannel()
    @isMusicPlaying()
    @isSameVoiceChannel()
    public execute(message: IMessage, args: string[]): any {
        const mode = args[0];
        if (mode === "all" || mode === "queue" || mode === "*" || mode === "2") {
            message.guild!.queue!.loopMode = 2;
            return message.channel.send(createEmbed("info", "🔁  **|**  Repeating all music in the queue"));
        } else if (mode === "current" || mode === "one" || mode === "musiconly" || mode === "1") {
            message.guild!.queue!.loopMode = 1;
            return message.channel.send(createEmbed("info", "🔂  **|**  Repeating this music only"));
        } else if (mode === "disable" || mode === "off" || mode === "0") {
            message.guild!.queue!.loopMode = 0;
            return message.channel.send(createEmbed("info", "▶  **|**  Repeating disabled"));
        }
        message.channel.send(`Invalid value, see **\`${this.client.config.prefix}help ${this.meta.name}\`** for more information!`).catch(e => this.client.logger.error("REPEAT_CMD_ERR:", e));
    }
}
