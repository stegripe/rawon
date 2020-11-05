import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import type { IMessage } from "../../typings";
import type Disc_11 from "../structures/Disc_11";

export default class QueueCommand extends BaseCommand {
    public constructor(public client: Disc_11, public readonly path: string) {
        super(client, path, {
            aliases: ["q", "queue-list", "music-list"]
        }, {
            name: "queue",
            description: "Show the current track queue",
            usage: "{prefix}queue"
        });
    }

    public execute(message: IMessage): any {
        if (!message.guild?.queue) return message.channel.send(new MessageEmbed().setDescription("There is nothing playing.").setColor("YELLOW"));

        const embed = new MessageEmbed().setTitle("⌛ Song Queue").setColor(this.client.config.embedColor);

        let num = 1;
        const songs = message.guild.queue.songs.map(s => `${num++} - ${s.title}`);
        if (message.guild.queue.songs.size > 10) {
            const indexes: string[] = this.chunk(songs, 10);
            let index = 0;
            embed.setDescription(`\`\`\`\n${indexes[index]}\`\`\``).setFooter(`• Page ${index + 1} of ${indexes.length}`, "https://hzmi.xyz/assets/images/390511462361202688.png");
            message.channel.send(embed).then(msg => {
                msg.react("◀️").then(() => {
                    msg.react("▶️").catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
                    msg.createReactionCollector((reaction, user) => reaction.emoji.name === "◀️" && user.id === message.author.id, { time: 80 * 1000 }).on("collect", () => {
                        if (index === 0) return undefined;
                        index--;
                        embed.setDescription(indexes[index]).setFooter(`Page ${index + 1} of ${indexes.length}`, "https://hzmi.xyz/assets/images/390511462361202688.png");
                        msg.edit(embed).catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
                    });
                    msg.createReactionCollector((reaction, user) => reaction.emoji.name === "▶️" && user.id === message.author.id, { time: 80 * 1000 }).on("collect", () => {
                        if (index + 1 === indexes.length) return undefined;
                        index++;
                        embed.setDescription(indexes[index]).setFooter(`Page ${index + 1} of ${indexes.length}`, "https://hzmi.xyz/assets/images/390511462361202688.png");
                        msg.edit(embed).catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
                    });
                }).catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
            }).catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
        } else {
            message.channel.send(embed.setDescription(songs.join("\n"))).catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
        }
    }

    private chunk(array: Array<any> | string, chunkSize: number): Array<any> {
        const temp = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            temp.push(array.slice(i, i + chunkSize));
        }
        return temp;
    }
}
