import { CommandContext } from "../../structures/CommandContext";
import { haveQueue } from "../../utils/decorators/MusicUtil";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { IQueueSong } from "../../typings";
import i18n from "../../config";
import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { AudioPlayerState, AudioResource } from "@discordjs/voice";

export class NowPlayingCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
            aliases: ["np"],
            description: i18n.__("commands.music.nowplaying.description"),
            name: "nowplaying",
            slash: {
                options: []
            },
            usage: "{prefix}nowplaying"
        });
    }

    public async execute(ctx: CommandContext): Promise<void> {
        if (!haveQueue(ctx)) return;

        function getEmbed(): MessageEmbed {
            const song = ((ctx.guild?.queue?.player?.state as (AudioPlayerState & { resource: AudioResource|undefined })|undefined)?.resource?.metadata as IQueueSong|undefined)?.song;

            return createEmbed("info", `${ctx.guild?.queue?.playing ? "▶" : "⏸"} **|** ${song ? `**[${song.title}](${song.url})**` : i18n.__("commands.music.nowplaying.emptyQueue")}`).setThumbnail(song?.thumbnail ?? "https://api.zhycorp.net/assets/images/icon.png");
        }

        const buttons = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId("TOGGLE_STATE_BUTTON")
                    .setLabel("Pause/Resume")
                    .setStyle("PRIMARY")
                    .setEmoji("⏯️"),
                new MessageButton()
                    .setCustomId("SKIP_BUTTON")
                    .setLabel("Skip")
                    .setStyle("SECONDARY")
                    .setEmoji("⏭"),
                new MessageButton()
                    .setCustomId("STOP_BUTTON")
                    .setLabel("Stop Player")
                    .setStyle("DANGER")
                    .setEmoji("⏹"),
                new MessageButton()
                    .setCustomId("SHOW_QUEUE_BUTTON")
                    .setLabel("Show Queue")
                    .setStyle("SECONDARY")
                    .setEmoji("#️⃣")
            );
        const msg = await ctx.reply({ embeds: [getEmbed()], components: [buttons] });

        const collector = msg.createMessageComponentCollector({
            filter: i => i.isButton() && (i.user.id === ctx.author.id),
            idle: 30000
        });

        collector.on("collect", async i => {
            const newCtx = new CommandContext(i);
            let cmdName = "";

            switch (i.customId) {
                case "TOGGLE_STATE_BUTTON": {
                    cmdName = ctx.guild?.queue?.playing ? "pause" : "resume";
                    break;
                }

                case "SKIP_BUTTON": {
                    cmdName = "skip";
                    break;
                }

                case "SHOW_QUEUE_BUTTON": {
                    cmdName = "queue";
                    break;
                }

                case "STOP_BUTTON": {
                    cmdName = "stop";
                    break;
                }
            }
            await this.client.commands.get(cmdName)?.execute(newCtx);

            const embed = getEmbed();

            await msg.edit({ embeds: [embed] });
        }).on("end", () => {
            const embed = getEmbed()
                .setFooter(i18n.__("commands.music.nowplaying.disableButton"));

            void msg.edit({
                embeds: [embed],
                components: []
            });
        });
    }
}
