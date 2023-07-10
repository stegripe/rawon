import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import i18n from "../../config/index.js";
import { ApplicationCommandOptionType } from "discord.js";

@Command({
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
                type: ApplicationCommandOptionType.String
            }
        ]
    },
    usage: "{prefix}shuffle [enable | disable]"
})
export class ShuffleCommand extends BaseCommand {
    @inVC
    @haveQueue
    @sameVC
    public execute(ctx: CommandContext): void {
        const newState = ctx.options?.getString("state") ?? (ctx.args[0] as string | undefined);
        if (!newState) {
            void ctx.reply({
                embeds: [
                    createEmbed(
                        "info",
                        `🔀 **|** ${i18n.__mf("commands.music.shuffle.actualState", {
                            state: `\`${ctx.guild?.queue?.shuffle ? "ENABLED" : "DISABLED"}\``
                        })}`
                    )
                ]
            });
            return;
        }

        ctx.guild!.queue!.shuffle = newState === "enable";
        const isShuffle = ctx.guild?.queue?.shuffle;

        void ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    `${isShuffle ? "🔀" : "▶"} **|** ${i18n.__mf("commands.music.shuffle.newState", {
                        state: `\`${isShuffle ? "ENABLED" : "DISABLED"}\``
                    })}`
                )
            ]
        });
    }
}
