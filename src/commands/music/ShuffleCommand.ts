import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import i18n from "../../config";

export class ShuffleCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
            description: i18n.__("commands.music.shuffle.description"),
            name: "shuffle",
            slash: {
                options: [
                    {
                        choices: [
                            {
                                name: "ENABLE",
                                value: "enable"
                            },
                            {
                                name: "DISABLE",
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
        });
    }

    public execute(ctx: CommandContext): void {
        if (!inVC(ctx)) return;
        if (!haveQueue(ctx)) return;
        if (!sameVC(ctx)) return;
        const newState = ctx.options?.getString("state") ?? ctx.args[0] as string | undefined;
        if (!newState) {
            void ctx.reply({ embeds: [createEmbed("info", `🔀 **|** ${i18n.__mf("commands.music.shuffle.actualState", { state: `\`${ctx.guild?.queue?.shuffle ? "ENABLED" : "DISABLED"}\`` })}`)] });
            return;
        }

        ctx.guild!.queue!.shuffle = (newState === "enable");
        const isShuffle = ctx.guild?.queue?.shuffle;

        void ctx.reply({ embeds: [createEmbed("success", `${isShuffle ? "🔀" : "▶"} **|** ${i18n.__mf("commands.music.shuffle.newState", { state: `\`${isShuffle ? "ENABLED" : "DISABLED"}\`` })}`)] });
    }
}
