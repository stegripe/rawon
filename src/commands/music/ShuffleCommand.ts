import { ApplicationCommandOptionType } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { haveQueue, inVC, sameVC, useRequestChannel } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";

@Command({
    description: i18n.__("commands.music.shuffle.description"),
    name: "shuffle",
    slash: {
        options: [
            {
                choices: [
                    {
                        name: "ENABLE",
                        value: "enable",
                    },
                    {
                        name: "DISABLE",
                        value: "disable",
                    },
                ],
                description: i18n.__("commands.music.shuffle.description"),
                name: "state",
                required: false,
                type: ApplicationCommandOptionType.String,
            },
        ],
    },
    usage: "{prefix}shuffle [enable | disable]",
})
export class ShuffleCommand extends BaseCommand {
    @useRequestChannel
    @inVC
    @haveQueue
    @sameVC
    public execute(ctx: CommandContext): void {
        const __ = i18n__(this.client, ctx.guild);
        const __mf = i18n__mf(this.client, ctx.guild);

        const newState = ctx.options?.getString("state") ?? (ctx.args[0] as string | undefined);
        if ((newState?.length ?? 0) === 0) {
            void ctx.reply({
                embeds: [
                    createEmbed(
                        "info",
                        `🔀 **|** ${__mf("commands.music.shuffle.actualState", {
                            state: `**\`${ctx.guild?.queue?.shuffle === true ? __("reusable.enabled") : __("reusable.disabled")}\`**`,
                        })}`,
                    ),
                ],
            });
            return;
        }

        ctx.guild?.queue?.setShuffle(newState === "enable");
        const isShuffle = ctx.guild?.queue?.shuffle;

        void ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    `${isShuffle === true ? "🔀" : "▶️"} **|** ${__mf(
                        "commands.music.shuffle.newState",
                        {
                            state: `**\`${isShuffle === true ? __("reusable.enabled") : __("reusable.disabled")}\`**`,
                        },
                    )}`,
                ),
            ],
        });
    }
}
