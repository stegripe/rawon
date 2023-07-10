import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil.js";
import { OperationManager } from "../../utils/structures/OperationManager.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import { QueueSong } from "../../typings/index.js";
import i18n from "../../config/index.js";
import { AudioPlayerPlayingState } from "@discordjs/voice";
import { GuildMember } from "discord.js";

@Command<typeof SkipCommand>({
    aliases: ["s"],
    description: i18n.__("commands.music.skip.description"),
    name: "skip",
    slash: {
        options: []
    },
    usage: "{prefix}skip"
})
export class SkipCommand extends BaseCommand {
    private readonly manager = new OperationManager();
    @inVC
    @haveQueue
    @sameVC
    public async execute(ctx: CommandContext): Promise<void> {
        const djRole = await this.client.utils.fetchDJRole(ctx.guild!).catch(() => null);
        const song = (ctx.guild!.queue!.player.state as AudioPlayerPlayingState).resource.metadata as QueueSong;

        function ableToSkip(member: GuildMember): boolean {
            return (
                member.roles.cache.has(djRole?.id ?? "") ||
                member.permissions.has("ManageGuild") ||
                song.requester.id === member.id
            );
        }

        if (!ableToSkip(ctx.member!)) {
            const required = this.client.utils.requiredVoters(ctx.guild!.members.me!.voice.channel!.members.size);

            if (ctx.guild?.queue?.skipVoters.includes(ctx.author.id)) {
                await this.manager.add(() => {
                    ctx.guild!.queue!.skipVoters = ctx.guild!.queue!.skipVoters.filter(x => x !== ctx.author.id);

                    return undefined;
                });
                await ctx.reply(
                    i18n.__mf("commands.music.skip.voteResultMessage", {
                        length: ctx.guild.queue.skipVoters.length,
                        required
                    })
                );

                return;
            }

            await this.manager.add(() => {
                ctx.guild?.queue?.skipVoters.push(ctx.author.id);

                return undefined;
            });

            const length = ctx.guild!.queue!.skipVoters.length;
            await ctx.reply(i18n.__mf("commands.music.skip.voteResultMessage", { length, required }));

            if (length < required) return;
        }

        if (!ctx.guild?.queue?.playing) ctx.guild!.queue!.playing = true;
        ctx.guild?.queue?.player.stop(true);
        void ctx
            .reply({
                embeds: [
                    createEmbed(
                        "success",
                        `⏭ **|** ${i18n.__mf("commands.music.skip.skipMessage", {
                            song: `[${song.song.title}](${song.song.url}})`
                        })}`
                    ).setThumbnail(song.song.thumbnail)
                ]
            })
            .catch(e => this.client.logger.error("SKIP_CMD_ERR:", e));
    }
}
