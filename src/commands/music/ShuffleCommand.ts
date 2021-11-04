import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import i18n from "../../config";

@DefineCommand({
    description: i18n.__("commands.music.shuffle.description"),
    name: "shuffle",
    slash: {
        options: [
            {
                choices: [
                    {
                        name: "Enable",
                        value: "enable"
                    },
                    {
                        name: "Disable",
                        value: "disable"
                    }
                ],
                description: i18n.__("commands.music.shuffle.description"),
                name: "state",
                required: false,
                type: "STRING"
            }
        ]
    },
    usage: "{prefix}shuffle [enable | disable]"
})
export class ShuffleCommand extends BaseCommand {
    @inVC()
    @haveQueue()
    @sameVC()
    public execute(ctx: CommandContext): void {
        const newState = ctx.options?.getString("state") ?? ctx.args[0] as string | undefined;
        if (!newState) {
            void ctx.reply({ embeds: [createEmbed("info", `🔀 **|** ${i18n.__mf("commands.music.shuffle.actualState", { state: `\`${ctx.guild?.queue?.shuffle ? "ENABLED" : "DISABLED"}\`` })}`)] });
            return;
        }

        ctx.guild!.queue!.shuffle = (newState === "enable");
        const isShuffle = ctx.guild?.queue?.shuffle;

        void ctx.reply({ embeds: [createEmbed("info", `${isShuffle ? "🔀" : "▶"} **|** ${i18n.__mf("commands.music.shuffle.newState", { state: `\`${isShuffle ? "ENABLED" : "DISABLED"}\`` })}`)] });
    }
}
