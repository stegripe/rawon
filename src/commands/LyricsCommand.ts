import { BaseCommand } from "../structures/BaseCommand";
import { IMessage } from "../../typings";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { createEmbed } from "../utils/createEmbed";
import { isUserInTheVoiceChannel, isSameVoiceChannel, isValidVoiceChannel } from "../utils/decorators/MusicHelper";
import fetch from "node-fetch";

@DefineCommand({
    aliases: ["ly"],
    name: "lyrics",
    description: "Get lyrics from the current music",
    usage: "{prefix}lyrics"
})
export class LyricsCommand extends BaseCommand {
    @isUserInTheVoiceChannel()
    @isValidVoiceChannel()
    @isSameVoiceChannel()
    public async execute(message: IMessage): Promise<void> {
        const song = message.guild?.queue?.songs.first()?.title;
        if (!message.guild?.queue?.songs) {
            message.channel.send(createEmbed("error", "There is nothing playing")).catch(e => this.client.logger.error("LYRICS_CMD_ERR:", e));
        } else if (song) {
            const url = `https://api.lxndr.dev/lyrics?song=${encodeURI(song)}`;
            void fetch(url)
                .then(response => response.json())
                .then(data => {
                    let lyrics = data.lyrics;
                    let albumArt = data.album_art;
                    const charLength = lyrics.length;
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
                    if (!albumArt) albumArt = "https://api.zhycorp.com/assets/images/logo.png";
                    message.channel.send(
                        createEmbed("info", lyrics.substring(0, 2047))
                            .setAuthor(song)
                            .setThumbnail(albumArt)
                    ).catch(e => this.client.logger.error("LYRICS_CMD_ERR:", e));
                    lyrics = lyrics.replace(lyrics.substring(0, 2047), "");
                    for (let i = 2; i <= cantEmbeds; i++) {
                        message.channel.send(
                            createEmbed("info", lyrics.substring(0, 2047))
                        ).catch(e => this.client.logger.error("LYRICS_CMD_ERR:", e));

                        lyrics = lyrics.replace(lyrics.substring(0, 2048), "");
                    }
                });
        }
    }
}
