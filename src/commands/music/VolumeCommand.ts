import { inVC, sameVC, validVC } from "../../utils/decorators/MusicUtil";
import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { AudioPlayerPlayingState } from "@discordjs/voice";

@DefineCommand({
    aliases: ["vol"],
    description: "Change the media player volume",
    name: "volume",
    slash: {
        name: "volume",
        options: [
            {
                description: "New volume",
                name: "Volume",
                type: "NUMBER",
                required: false
            }
        ]
    }
})
export class VolumeCommand extends BaseCommand {
    @inVC()
    @validVC()
    @sameVC()
    public execute(ctx: CommandContext): any {
        const volume = Number(ctx.isInteraction() ? ctx.options?.getNumber("Volume", false) : ctx.args[0]);
        const resVolume = (ctx.guild!.queue!.player!.state as AudioPlayerPlayingState).resource.volume!;

        if (isNaN(volume)) return ctx.reply({ embeds: [createEmbed("info", `🔊 **|** The current volume is **\`${resVolume.volume}\`**`)] });

        if (volume <= 0) return ctx.reply({ embeds: [createEmbed("error", `Please pause the music instead of setting the volume to **\`${volume}\`**`)] });
        if (volume > 100) return ctx.reply({ embeds: [createEmbed("error", "I can't set the volume above **\`100\`**")] });

        resVolume.setVolume(volume / 100);
        return ctx.reply({ embeds: [createEmbed("info", `🔊 **|** Volume set to **\`${volume}\`**`)] });
    }
}
