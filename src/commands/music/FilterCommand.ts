import { inVC, sameVC, validVC } from "../../utils/decorators/MusicUtil";
import { CommandContext } from "../../structures/CommandContext";
import { createEmbed } from "../../utils/functions/createEmbed";
import { BaseCommand } from "../../structures/BaseCommand";
import { Command } from "../../utils/decorators/Command";
import { filterArgs } from "../../utils/functions/ffmpegArgs";
/* import i18n from "../../config"; */

@Command({
    aliases: [],
    description: "...",
    name: "filter",
    usage: "{prefix}filter"
})
export class FilterCommand extends BaseCommand {
    @inVC
    @validVC
    @sameVC
    public execute(ctx: CommandContext): void {
        const filter = ctx.args[0] as keyof typeof filterArgs;
        if (!filterArgs[filter]) {
            void ctx.reply({ embeds: [createEmbed("error", "Please specify the filter you want to set")] });
            return;
        }

        const state = ctx.args[1];
        if (state !== "enable" && state !== "disable") {
            void ctx.reply({ embeds: [createEmbed("info", `\`${filter}\` filter is ${ctx.guild?.queue?.filters[filter] ? "ON" : "OFF"}`)] });
            return;
        }

        ctx.guild?.queue?.setFilter(filter, state === "enable");
        void ctx.reply({
            embeds: [
                createEmbed("info", `\`${filter}\` set to ${state === "enable" ? "ON" : "OFF"}`)
            ]
        });
    }
}
