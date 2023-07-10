import { createProgressBar } from "../../utils/functions/createProgressBar.js";
import { normalizeTime } from "../../utils/functions/normalizeTime.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { haveQueue } from "../../utils/decorators/MusicUtil.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import { QueueSong } from "../../typings/index.js";
import i18n from "../../config/index.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } from "discord.js";
import { AudioPlayerState, AudioResource } from "@discordjs/voice";

@Command<typeof NowPlayingCommand>({
    aliases: ["np"],
    description: i18n.__("commands.music.nowplaying.description"),
    name: "nowplaying",
    slash: {
        options: []
    },
    usage: "{prefix}nowplaying"
})
export class NowPlayingCommand extends BaseCommand {
    @haveQueue
    public async execute(ctx: CommandContext): Promise<void> {
        function getEmbed(): EmbedBuilder {
            const res = (
                ctx.guild?.queue?.player.state as
                | (AudioPlayerState & {
                    resource: AudioResource | undefined;
                })
                | undefined
            )?.resource;
            const song = (res?.metadata as QueueSong | undefined)?.song;

            const embed = createEmbed("info", `${ctx.guild?.queue?.playing ? "▶" : "⏸"} **|** `).setThumbnail(
                song?.thumbnail ?? "https://cdn.clytage.org/images/icon.png"
            );

            const curr = ~~(res!.playbackDuration / 1000);
            embed.data.description += song
                ? `**[${song.title}](${song.url})**\n` +
                `${normalizeTime(curr)} ${createProgressBar(curr, song.duration)} ${normalizeTime(song.duration)}`
                : i18n.__("commands.music.nowplaying.emptyQueue");

            return embed;
        }

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("TOGGLE_STATE_BUTTON")
                .setLabel("Pause/Resume")
                .setStyle(ButtonStyle.Primary)
                .setEmoji("⏯️"),
            new ButtonBuilder()
                .setCustomId("SKIP_BUTTON")
                .setLabel("Skip")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("⏭"),
            new ButtonBuilder()
                .setCustomId("STOP_BUTTON")
                .setLabel("Stop Player")
                .setStyle(ButtonStyle.Danger)
                .setEmoji("⏹"),
            new ButtonBuilder()
                .setCustomId("SHOW_QUEUE_BUTTON")
                .setLabel("Show Queue")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("#️⃣")
        );
        const msg = await ctx.reply({ embeds: [getEmbed()], components: [buttons] });

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: i => i.isButton() && i.user.id === ctx.author.id,
            idle: 30000
        });

        collector
            .on("collect", async i => {
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
            })
            .on("end", () => {
                const embed = getEmbed().setFooter({ text: i18n.__("commands.music.nowplaying.disableButton") });

                void msg.edit({
                    embeds: [embed],
                    components: []
                });
            });
    }
}
