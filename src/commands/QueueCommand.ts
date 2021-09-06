import { isMusicQueueExists } from "../utils/decorators/MusicHelper";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { BaseCommand } from "../structures/BaseCommand";
import { createEmbed } from "../utils/createEmbed";
import { Message, TextChannel } from "discord.js";

@DefineCommand({
    aliases: ["q"],
    description: "Show the current queue",
    name: "queue",
    usage: "{prefix}queue"
})
export class QueueCommand extends BaseCommand {
    @isMusicQueueExists()
    public execute(message: Message): any {
        const embed = createEmbed("info")
            .setThumbnail(message.client.user?.avatarURL() as string)
            .setTitle("Queue List");

        let num = 1;
        const songs = message.guild?.queue?.songs.map(s => `**${num++}.** **[${s.title}](${s.url})**`);
        if (Number(message.guild?.queue?.songs.size) > 12) {
            const indexes: string[] = this.client.util.chunk(songs!, 12);
            let index = 0;
            embed.setDescription(indexes[index]).setFooter(`Page ${index + 1} of ${indexes.length}`, "https://raw.githubusercontent.com/zhycorp/disc-11/main/.github/images/info.png");
            const reactions = ["◀️", "▶️"];
            message.channel.send(embed).then(msg => {
                msg.react("◀️").then(() => {
                    msg.react("▶️").catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
                    const isMessageManageable = (msg.channel as TextChannel).permissionsFor(msg.client.user!)?.has("MANAGE_MESSAGES");
                    msg.createReactionCollector((reaction, user) => reactions.includes(reaction.emoji.name) && user.id === message.author.id, { time: 80 * 1000 })
                        .on("collect", (reaction, user) => {
                            if (isMessageManageable) reaction.users.remove(user).catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
                            switch (reaction.emoji.name) {
                                case "◀️":
                                    if (index === 0) return undefined;
                                    index--;
                                    break;

                                case "▶️":
                                    if (index + 1 === indexes.length) return undefined;
                                    index++;
                                    break;
                            }
                            embed.setDescription(indexes[index]).setFooter(`Page ${index + 1} of ${indexes.length}`, "https://raw.githubusercontent.com/zhycorp/disc-11/main/.github/images/info.png");
                            msg.edit(embed).catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
                        })
                        .on("end", () => {
                            if (isMessageManageable) msg.reactions.removeAll().catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
                        });
                }).catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
            }).catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
        } else {
            message.channel.send(embed.setDescription(songs!.join("\n"))).catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
        }
    }
}
