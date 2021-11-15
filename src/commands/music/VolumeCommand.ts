import { inVC, sameVC, validVC } from "../../utils/decorators/MusicUtil";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import i18n from "../../config";
import { AudioPlayerPlayingState } from "@discordjs/voice";
import { Message } from "discord.js";

export class VolumeCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
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
        });
    }

    public execute(ctx: CommandContext): Promise<Message>|void {
        if (!inVC(ctx)) return;
        if (!validVC(ctx)) return;
        if (!sameVC(ctx)) return;

        const volume = Number(ctx.args[0] ?? ctx.options?.getNumber("volume", false));
        const resVolume = (ctx.guild!.queue!.player!.state as AudioPlayerPlayingState).resource.volume!;

        if (isNaN(volume)) return ctx.reply({ embeds: [createEmbed("info", `🔊 **|** ${i18n.__mf("commands.music.volume.currentVolume", { volume: `\`${resVolume.volume * 100}\`` })}`).setFooter(i18n.__("commands.music.volume.changeVolume"))] });
        if (volume <= 0) return ctx.reply({ embeds: [createEmbed("warn", i18n.__mf("commands.music.volume.plsPause", { volume: `\`${volume}\`` }))] });
        if (volume > 100) return ctx.reply({ embeds: [createEmbed("error", i18n.__mf("commands.music.volume.volumeLimit", { maxVol: `\`100\`` }), true)] });

        resVolume.setVolume(volume / 100);
        return ctx.reply({ embeds: [createEmbed("success", `🔊 **|** ${i18n.__mf("commands.music.volume.newVolume", { volume })}`)] });
    }
}
