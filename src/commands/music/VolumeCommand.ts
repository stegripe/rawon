import { createProgressBar } from "../../utils/functions/createProgressBar";
import { inVC, sameVC, validVC } from "../../utils/decorators/MusicUtil";
import { CommandContext } from "../../structures/CommandContext";
import { createEmbed } from "../../utils/functions/createEmbed";
import { BaseCommand } from "../../structures/BaseCommand";
import { Command } from "../../utils/decorators/Command";
import i18n from "../../config";
import { Message, MessageActionRow, MessageButton } from "discord.js";

@Command({
    aliases: ["vol"],
    description: i18n.__("commands.music.volume.description"),
    name: "volume",
    slash: {
        options: [
            {
                description: i18n.__("commands.music.volume.slashDescription"),
                name: "volume",
                type: "NUMBER",
                required: false
            }
        ]
    },
    usage: i18n.__("commands.music.volume.usage")
})
export class VolumeCommand extends BaseCommand {
    @inVC
    @validVC
    @sameVC
    public async execute(ctx: CommandContext): Promise<Message | undefined> {
        const volume = Number(ctx.args[0] ?? ctx.options?.get("volume", false)?.value);
        const current = ctx.guild!.queue!.volume;

        if (isNaN(volume)) {
            const buttons = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId("10")
                    .setLabel("10%")
                    .setStyle("PRIMARY"),
                new MessageButton()
                    .setCustomId("25")
                    .setLabel("25%")
                    .setStyle("PRIMARY"),
                new MessageButton()
                    .setCustomId("50")
                    .setLabel("50%")
                    .setStyle("PRIMARY"),
                new MessageButton()
                    .setCustomId("75")
                    .setLabel("75%")
                    .setStyle("PRIMARY"),
                new MessageButton()
                    .setCustomId("100")
                    .setLabel("100%")
                    .setStyle("PRIMARY")
            );

            const msg = await ctx.reply({
                embeds: [
                    createEmbed(
                        "info",
                        `🔊 **|** ${i18n.__mf("commands.music.volume.currentVolume", {
                            volume: `\`${current}\``
                        })}\n${current}% ${createProgressBar(current, 100)} 100%`
                    ).setFooter({ text: i18n.__("commands.music.volume.changeVolume") })
                ],
                components: [buttons]
            });

            const collector = msg.createMessageComponentCollector({
                filter: i => i.isButton() && i.user.id === ctx.author.id,
                idle: 30000
            });

            collector.on("collect", async i => {
                const newContext = new CommandContext(i, [i.customId]);
                const newVolume = Number(i.customId);
                await this.execute(newContext);

                void msg.edit({
                    embeds: [
                        createEmbed(
                            "info",
                            `🔊 **|** ${i18n.__mf("commands.music.volume.currentVolume", {
                                volume: `\`${newVolume}\``
                            })}\n${newVolume}% ${createProgressBar(newVolume, 100)} 100%`
                        ).setFooter({ text: i18n.__("commands.music.volume.changeVolume") })
                    ],
                    components: [buttons]
                });
            })
                .on("end", () => {
                    const cur = ctx.guild!.queue!.volume;
                    void msg.edit({
                        embeds: [
                            createEmbed(
                                "info",
                                `🔊 **|** ${i18n.__mf("commands.music.volume.currentVolume", {
                                    volume: `\`${cur}\``
                                })}\n${cur}% ${createProgressBar(cur, 100)} 100%`
                            ).setFooter({ text: i18n.__("commands.music.volume.changeVolume") })
                        ],
                        components: []
                    });
                });
            return;
        }
        if (volume <= 0) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        i18n.__mf("commands.music.volume.plsPause", {
                            volume: `\`${volume}\``
                        })
                    )
                ]
            });
        }
        if (volume > 100) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        i18n.__mf("commands.music.volume.volumeLimit", {
                            maxVol: "`100`"
                        }),
                        true
                    )
                ]
            });
        }

        ctx.guild!.queue!.volume = volume;
        return ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    `🔊 **|** ${i18n.__mf("commands.music.volume.newVolume", {
                        volume
                    })}`
                )
            ]
        });
    }
}
