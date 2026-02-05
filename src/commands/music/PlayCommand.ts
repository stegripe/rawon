/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import {
    type GuildMember,
    type Message,
    PermissionFlagsBits,
    type SlashCommandBuilder,
    type VoiceBasedChannel,
} from "discord.js";
import i18n from "../../config/index.js";
import { type CommandContext as LocalCommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { inVC, sameVC, useRequestChannel, validVC } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";
import { checkQuery, handleVideos, searchTrack } from "../../utils/handlers/GeneralUtil.js";

@ApplyOptions<Command.Options>({
    name: "play",
    aliases: ["p", "add"],
    description: i18n.__("commands.music.play.description"),
    detailedDescription: { usage: i18n.__("commands.music.play.usage") },
    requiredClientPermissions: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
    ],
    chatInputCommand(
        builder: Parameters<NonNullable<Command.Options["chatInputCommand"]>>[0],
        opts: Parameters<NonNullable<Command.Options["chatInputCommand"]>>[1],
    ): SlashCommandBuilder {
        return builder
            .setName(opts.name ?? "play")
            .setDescription(opts.description ?? i18n.__("commands.music.play.description"))
            .addStringOption((opt) =>
                opt
                    .setName("query")
                    .setDescription(i18n.__("commands.music.play.slashQueryDescription"))
                    .setRequired(true),
            ) as SlashCommandBuilder;
    },
})
export class PlayCommand extends ContextCommand {
    private getClient(ctx: CommandContext): Rawon {
        return ctx.client as Rawon;
    }

    @useRequestChannel
    @inVC
    @validVC
    @sameVC
    public async contextRun(ctx: CommandContext): Promise<Message | undefined> {
        const localCtx = ctx as unknown as LocalCommandContext;
        const member = localCtx.member as GuildMember | null;
        const client = this.getClient(ctx);
        const __ = i18n__(client, ctx.guild);
        const __mf = i18n__mf(client, ctx.guild);

        if (ctx.isCommandInteraction() && !localCtx.deferred) {
            await localCtx.deferReply();
        }

        const voiceChannel = member?.voice.channel as unknown as VoiceBasedChannel;
        if (localCtx.additionalArgs.get("fromSearch") !== undefined) {
            const tracks = localCtx.additionalArgs.get("values") as string[];
            const searchResults = await Promise.all(
                tracks.map(async (track) => searchTrack(client, track).catch(() => null)),
            );
            const toQueue = searchResults
                .filter((result): result is NonNullable<typeof result> => result !== null)
                .map((result) => result.items[0]);

            return handleVideos(client, localCtx, toQueue, voiceChannel);
        }

        const query =
            (localCtx.args.join(" ") || localCtx.options?.getString("query")) ??
            (localCtx.additionalArgs.get("values") === undefined
                ? undefined
                : (localCtx.additionalArgs.get("values") as (string | undefined)[])[0]);

        if ((query?.length ?? 0) === 0) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        __mf("reusable.invalidUsage", {
                            prefix: `**\`${client.config.mainPrefix}help\`**`,
                            name: `**\`${this.options.name}\`**`,
                        }),
                    ),
                ],
            });
        }

        if (
            ctx.guild?.queue &&
            voiceChannel.id !== ctx.guild.queue.connection?.joinConfig.channelId
        ) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        __mf("commands.music.play.alreadyPlaying", {
                            voiceChannel: `**\`${
                                ctx.guild.channels.cache.get(
                                    (
                                        ctx.guild.queue.connection?.joinConfig as {
                                            channelId: string;
                                        }
                                    ).channelId,
                                )?.name ?? "#unknown-channel"
                            }\`**`,
                        }),
                    ),
                ],
            });
        }

        const queryCheck = checkQuery(query ?? "");
        const songs = await searchTrack(client, query ?? "").catch(() => void 0);

        if (!songs || songs.items.length <= 0) {
            return ctx.reply({
                embeds: [createEmbed("error", __("commands.music.play.noSongData"), true)],
            });
        }

        return handleVideos(
            client,
            localCtx,
            queryCheck.type === "playlist" ? songs.items : [songs.items[0]],
            voiceChannel,
        );
    }
}
