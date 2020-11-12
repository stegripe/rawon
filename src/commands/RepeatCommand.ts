import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import { ICommandComponent, IMessage } from "../../typings";
import Disc_11 from "../structures/Disc_11";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { isUserInTheVoiceChannel, isMusicPlaying, isSameVoiceChannel } from "../utils/decorators/MusicHelper";

@DefineCommand({
    aliases: ["loop", "music-repeat", "music-loop"],
    name: "repeat",
    description: "Repeat the current track or queue",
    usage: "{prefix}repeat <all | one | disable>"
})
export default class RepeatCommand extends BaseCommand {
    public constructor(public client: Disc_11, public meta: ICommandComponent["meta"]) { super(client, meta); }

    @isUserInTheVoiceChannel()
    @isMusicPlaying()
    @isSameVoiceChannel()
    public execute(message: IMessage, args: string[]): any {
        const mode = args[0];
        if (mode === "all" || mode === "queue" || mode === "*" || mode === "2") {
            message.guild!.queue!.loopMode = 2;
            return message.channel.send(new MessageEmbed().setDescription("🔁  **|**  Repeating all music in the queue").setColor(this.client.config.embedColor));
        } else if (mode === "current" || mode === "one" || mode === "musiconly" || mode === "1") {
            message.guild!.queue!.loopMode = 1;
            return message.channel.send(new MessageEmbed().setDescription("🔂  **|**  Repeating this music only").setColor(this.client.config.embedColor));
        } else if (mode === "disable" || mode === "off" || mode === "0") {
            message.guild!.queue!.loopMode = 0;
            return message.channel.send(new MessageEmbed().setDescription("▶  **|**  Repeating disabled.").setColor(this.client.config.embedColor));
        }
        message.channel.send(`Invalid value, see **\`${this.client.config.prefix}help ${this.meta.name}\`** for more information!`).catch(e => this.client.logger.error("REPEAT_CMD_ERR:", e));
    }
}
