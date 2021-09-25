import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { IQueueSong } from "../../typings";
import { AudioPlayerPlayingState } from "@discordjs/voice";
import { GuildMember } from "discord.js";

@DefineCommand({
    aliases: ["s"],
    description: "Skip the track",
    name: "skip",
    slash: {
    },
    usage: "{prefix}skip"
})
export class SkipCommand extends BaseCommand {
    @inVC()
    @haveQueue()
    @sameVC()
    public async execute(ctx: CommandContext): Promise<void> {
        const djRole = await this.client.utils.fetchDJRole(ctx.guild!);
        const song = (ctx.guild!.queue!.player!.state as AudioPlayerPlayingState).resource.metadata as IQueueSong;

        function ableToSkip(member: GuildMember): boolean {
            return member.roles.cache.has(djRole.id) || member.permissions.has("MANAGE_GUILD") || (song.requester.id === member.id);
        }

        if (!ableToSkip(ctx.member!)) {
            const required = this.client.utils.requiredVoters(ctx.guild!.me!.voice.channel!.members.size);

            if (ctx.guild?.queue?.skipVoters.includes(ctx.author.id)) {
                ctx.guild.queue.skipVoters = ctx.guild.queue.skipVoters.filter(x => x !== ctx.author.id);
                await ctx.reply(`${ctx.guild.queue.skipVoters.length}/${required} voted to skip the current song`);

                return;
            }

            ctx.guild?.queue?.skipVoters.push(ctx.author.id);

            const length = ctx.guild!.queue!.skipVoters.length;
            await ctx.reply(`${length}/${required} voted to skip the current song`);

            if (length < required) return;
        }

        if (!ctx.guild?.queue?.playing) ctx.guild!.queue!.playing = true;
        ctx.guild!.queue!.skipVoters = [];
        ctx.guild?.queue?.player?.stop(true);
        void ctx.reply({ embeds: [createEmbed("info", `⏭ **|** Skipped **[${song.song.title}](${song.song.url}})**`).setThumbnail(song.song.thumbnail)] }).catch(e => this.client.logger.error("SKIP_CMD_ERR:", e));
    }
}
