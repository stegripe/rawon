import { type AudioPlayerPlayingState } from "@discordjs/voice";
import { type GuildMember } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { type QueueSong } from "../../typings/index.js";
import { Command } from "../../utils/decorators/Command.js";
import { haveQueue, inVC, sameVC, useRequestChannel } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";
import { OperationManager } from "../../utils/structures/OperationManager.js";

@Command<typeof SkipCommand>({
    aliases: ["s"],
    description: i18n.__("commands.music.skip.description"),
    name: "skip",
    slash: {
        options: [],
    },
    usage: "{prefix}skip",
})
export class SkipCommand extends BaseCommand {
    private readonly manager = new OperationManager();
    @useRequestChannel
    @inVC
    @haveQueue
    @sameVC
    public async execute(ctx: CommandContext): Promise<void> {
        const __ = i18n__(this.client, ctx.guild);
        const __mf = i18n__mf(this.client, ctx.guild);

        const queue = ctx.guild?.queue;
        if (!queue) {
            return;
        }

        if (!queue.canSkip()) {
            await ctx.reply({
                embeds: [createEmbed("warn", __("requestChannel.skipInProgress"))],
            });
            return;
        }

        const djRole = await this.client.utils
            .fetchDJRole(ctx.guild as unknown as GuildMember["guild"])
            .catch(() => null);
        const song = (queue.player.state as AudioPlayerPlayingState).resource.metadata as QueueSong;

        function ableToSkip(member: GuildMember): boolean {
            return (
                member.roles.cache.has(djRole?.id ?? "") ||
                member.permissions.has("ManageGuild") ||
                song.requester.id === member.id
            );
        }

        if (!ableToSkip(ctx.member as unknown as GuildMember)) {
            const required = this.client.utils.requiredVoters(
                ctx.guild?.members.me?.voice.channel?.members.size ?? 0,
            );

            if (queue.skipVoters.includes(ctx.author.id) === true) {
                await this.manager.add((): undefined => {
                    queue.skipVoters = queue.skipVoters.filter(
                        (x) => x !== ctx.author.id,
                    ) as unknown as string[];
                });
                await ctx.reply(
                    __mf("commands.music.skip.voteResultMessage", {
                        length: queue.skipVoters.length,
                        required,
                    }),
                );

                return;
            }

            await this.manager.add((): undefined => {
                queue.skipVoters.push(ctx.author.id);
            });

            const length = queue.skipVoters.length ?? 0;
            await ctx.reply(__mf("commands.music.skip.voteResultMessage", { length, required }));

            if (length < required) {
                return;
            }
        }

        if (!queue.startSkip()) {
            await ctx.reply({
                embeds: [createEmbed("warn", __("requestChannel.skipInProgress"))],
            });
            return;
        }

        if (!queue.playing) {
            queue.playing = true;
        }
        queue.player.stop(true);
        await ctx
            .reply({
                embeds: [
                    createEmbed(
                        "success",
                        `⏭️ **|** ${__mf("commands.music.skip.skipMessage", {
                            song: `[${song.song.title}](${song.song.url})`,
                        })}`,
                    ).setThumbnail(song.song.thumbnail),
                ],
            })
            .catch((error: unknown) => this.client.logger.error("SKIP_CMD_ERR:", error));
    }
}
