import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { ISong } from "../../typings";
import { createEmbed } from "../../utils/createEmbed";
import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { inVC, sameVC, validVC } from "../../utils/decorators/MusicUtils";

@DefineCommand({
    description: "Play some music",
    name: "play",
    slash: {
        description: "Play some music",
        name: "play",
        options: [
            {
                description: "Query to search",
                name: "query",
                type: "STRING"
            }
        ]
    }
})
export class PlayCommand extends BaseCommand {
    @inVC()
    @validVC()
    @sameVC()
    public async execute(ctx: CommandContext): Promise<any> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();

        const voiceChannel = ctx.member!.voice.channel!;
        const query = ((ctx.args.length ? ctx.args.join(" ") : undefined) ?? ctx.options?.getString("query")) ?? (ctx.additionalArgs.get("values") ? ctx.additionalArgs.get("values")[0] : undefined) as string|undefined;

        if (!query) {
            return ctx.reply({
                embeds: [createEmbed("warn", `Invalid usage, please use **\`${this.client.config.prefix}help ${this.meta.name}\`** for more information`)]
            });
        }

        const url = query.replace(/<(.+)>/g, "$1");

        if (ctx.guild?.queue && voiceChannel.id !== ctx.guild.queue.connection?.joinConfig.channelId) {
            return ctx.reply({ embeds: [createEmbed("warn", `The music player is already playing to **${ctx.guild.queue.connection.name}** voice channel`)] });
        }

        let song: ISong;

        try {
            const url = new URL(url);
        }

        return ctx.reply(query);
    }
}
