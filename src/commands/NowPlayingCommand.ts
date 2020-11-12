import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import type { ICommandComponent, IMessage } from "../../typings";
import type Disc_11 from "../structures/Disc_11";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { isMusicPlaying } from "../utils/decorators/MusicHelper";

@DefineCommand({
    aliases: ["np", "now-playing"],
    name: "nowplaying",
    description: "Send an information about the track",
    usage: "{prefix}nowplaying"
})
export default class NowPlayingCommand extends BaseCommand {
    public constructor(public client: Disc_11, public meta: ICommandComponent["meta"]) { super(client, meta); }

    @isMusicPlaying()
    public execute(message: IMessage): any {
        console.log(message);
        return message.channel.send(
            new MessageEmbed().setDescription(`${message.guild?.queue?.playing ? "▶  **|**  Now playing:" : "⏸  **|**  Now playing (paused):"} ` +
                `**[${message.guild?.queue?.songs.first()?.title as string}](${message.guild?.queue?.songs.first()?.url as string})**`)
                .setColor(this.client.config.embedColor)
        );
    }
}
