import { BaseCommand } from "../structures/BaseCommand";
import { IMessage } from "../../typings";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { isMusicPlaying, isSameVoiceChannel } from "../utils/decorators/MusicHelper";
import { createEmbed } from "../utils/createEmbed";

@DefineCommand({
    aliases: ["q"],
    name: "queue",
    description: "Show the current queue",
    usage: "{prefix}queue"
})
export class QueueCommand extends BaseCommand {
    @isMusicPlaying()
    @isSameVoiceChannel()
    public execute(message: IMessage): any {
        const embed = createEmbed("info")
            .setAuthor("Music Queue", message.client.user?.displayAvatarURL() as string);

        let num = 1;
        const songs = message.guild?.queue?.songs.map(s => `**${num++}.** **[${s.title}](${s.url})**`);
        if (Number(message.guild?.queue?.songs.size) > 1) {
            const indexes: string[] = this.chunk(songs!, 1);
            let index = 0;
            const duration: any = message.guild?.queue?.songs.first()?.duration;
            embed.setDescription(indexes[index]).setFooter(`Page ${index + 1} of ${indexes.length}`, "https://raw.githubusercontent.com/zhycorp/disc-11/main/.github/images/info.png");
            message.channel.send(embed).then(msg => {
                void msg.react("◀️");
                void msg.react("▶️");
                const filter = (reaction: any, user: any): boolean => (reaction.emoji.name === "◀️" || reaction.emoji.name === "▶️") && user.id !== msg.client.user?.id;
                const collector = msg.createReactionCollector(filter, {
                    time: (duration > 0) && (duration !== undefined) ? duration : 30000
                });
                collector.on("collect", (reaction, user) => {
                    if (!message.guild?.queue?.songs) return;
                    switch (reaction.emoji.name) {
                        case "◀️":
                            reaction.users.remove(user).catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
                            if (index === 0) return undefined;
                            index--;
                            embed.setDescription(indexes[index]).setFooter(`Page ${index + 1} of ${indexes.length}`, "https://raw.githubusercontent.com/zhycorp/disc-11/main/.github/images/info.png");
                            msg.edit(embed).catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
                            break;

                        case "▶️":
                            reaction.users.remove(user).catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
                            if (index + 1 === indexes.length) return undefined;
                            index++;
                            embed.setDescription(indexes[index]).setFooter(`Page ${index + 1} of ${indexes.length}`, "https://raw.githubusercontent.com/zhycorp/disc-11/main/.github/images/info.png");
                            msg.edit(embed).catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
                            break;
                        default:
                            reaction.users.remove(user).catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
                            break;
                    }
                });

                collector.on("end", () => {
                    msg.reactions.removeAll().catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
                    if (!msg.deleted) {
                        msg.delete({ timeout: 1000 }).catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
                    }
                });
            }).catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
        } else {
            message.channel.send(embed.setDescription(songs!.join("\n"))).catch(e => this.client.logger.error("QUEUE_CMD_ERR:", e));
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
