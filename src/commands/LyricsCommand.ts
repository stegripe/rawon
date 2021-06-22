import { DefineCommand } from "../utils/decorators/DefineCommand";
import { BaseCommand } from "../structures/BaseCommand";
import { createEmbed } from "../utils/createEmbed";
import { IMessage } from "../../typings";
import fetch from "node-fetch";

@DefineCommand({
    aliases: ["ly"],
    description: "Get lyrics from the current music",
    name: "lyrics",
    usage: "{prefix}lyrics"
})
export class LyricsCommand extends BaseCommand {
    public async execute(message: IMessage, args: string[]): Promise<void> {
        const song = message.guild?.queue?.songs.first()?.title;
        if (args[0]) {
            await this.sendLyrics(message, args.join(" "));
        } else if (song) {
            await this.sendLyrics(message, song);
        } else {
            message.channel.send(createEmbed("error", "There is nothing playing or no query was provided")).catch(e => this.client.logger.error("LYRICS_CMD_ERR:", e));
        }
    }

    private async sendLyrics(message: IMessage, song: string): Promise<any> {
        const url = `https://api.lxndr.dev/lyrics?song=${encodeURI(song)}&from=disc-11`;
        await fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    return message.channel.send(
                        createEmbed("error", `Failed to fetch lyrics for **${song}**`)
                    );
                }
                let lyrics: string = data.lyrics;
                let albumArt: string = data.album_art;
                const charLength: number = lyrics.length;
                let cantEmbeds = 0;

                if (charLength < 2048) {
                    cantEmbeds = 1;
                } else {
                    for (let i = 2; i < 10; i++) {
                        if (charLength < 2048 * i) {
                            cantEmbeds = i;
                            break;
                        }
                    }
                }
                let index = 0;
                const lyricsArr: any = [];
                const duration: any = message.guild?.queue?.songs.first()?.duration;
                if (!albumArt) albumArt = "https://api.zhycorp.net/assets/images/logo.png";
                lyricsArr.push([lyrics.substring(0, 2047)]);
                const embed = createEmbed("info")
                    .setAuthor(song.toUpperCase()).setThumbnail(albumArt)
                    .setDescription(lyricsArr[index].toString())
                    .setFooter(`Lyrics page 1 of ${cantEmbeds}`, "https://raw.githubusercontent.com/zhycorp/disc-11/main/.github/images/info.png");
                lyrics = lyrics.replace(lyrics.substring(0, 2047), "");
                for (let i = 2; i <= cantEmbeds; i++) {
                    lyricsArr.push([lyrics.substring(0, 2047)]);
                    lyrics = lyrics.replace(lyrics.substring(0, 2048), "");
                }
                if (cantEmbeds > 1) {
                    message.channel.send(embed).then(async msg => {
                        await msg.react("◀️");
                        await msg.react("▶️");
                        const filter = (reaction: any, user: any): boolean => (reaction.emoji.name === "◀️" || reaction.emoji.name === "▶️") && user.id !== msg.client.user?.id;
                        const collector = msg.createReactionCollector(filter, {
                            time: (duration > 0) && (duration !== undefined) ? duration : 60000
                        });
                        collector.on("collect", (reaction, user) => {
                            switch (reaction.emoji.name) {
                                case "◀️":
                                    reaction.users.remove(user).catch(e => this.client.logger.error("LYRICS_CMD_ERR:", e));
                                    if (index === 0) return undefined;
                                    index--;
                                    embed.setDescription(lyricsArr[index].toString()).setFooter(`Lyrics page ${index + 1} of ${lyricsArr.length}`, "https://raw.githubusercontent.com/zhycorp/disc-11/main/.github/images/info.png");
                                    msg.edit(embed).catch(e => this.client.logger.error("LYRICS_CMD_ERR:", e));
                                    break;
                                case "▶️":
                                    reaction.users.remove(user).catch(e => this.client.logger.error("LYRICS_CMD_ERR:", e));
                                    if (index + 1 === lyricsArr.length) return undefined;
                                    index++;
                                    embed.setDescription(lyricsArr[index]).setFooter(`Lyrics page ${index + 1} of ${lyricsArr.length}`, "https://raw.githubusercontent.com/zhycorp/disc-11/main/.github/images/info.png");
                                    msg.edit(embed).catch(e => this.client.logger.error("LYRICS_CMD_ERR:", e));
                                    break;
                                default:
                                    reaction.users.remove(user).catch(e => this.client.logger.error("LYRICS_CMD_ERR:", e));
                                    break;
                            }
                        });

                        collector.on("end", () => {
                            msg.reactions.removeAll().catch(e => this.client.logger.error("LYRICS_CMD_ERR:", e));
                        });
                    }).catch(e => this.client.logger.error("LYRICS_CMD_ERR:", e));
                } else {
                    message.channel.send(embed.setDescription(lyricsArr[index])).catch(e => this.client.logger.error("LYRICS_CMD_ERR:", e));
                }
            })
            .catch(e => this.client.logger.error("LYRICS_CMD_ERR:", e));
        return undefined;
    }
}
