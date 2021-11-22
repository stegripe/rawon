import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { play } from "../../utils/handlers/GeneralUtil";
import { createEmbed } from "../../utils/createEmbed";
import { IQueueSong } from "../../typings";
import i18n from "../../config";
import { AudioPlayerPlayingState } from "@discordjs/voice";
import { Message } from "discord.js";

export class SkipToCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
            aliases: ["st"],
            description: i18n.__("commands.music.skipTo.description"),
            name: "skipto",
            slash: {
                options: [
                    {
                        description: i18n.__("commands.music.skipTo.slashFirstDescription"),
                        name: "first",
                        type: "SUB_COMMAND"
                    },
                    {
                        description: i18n.__("commands.music.skipTo.slashLastDescription"),
                        name: "last",
                        type: "SUB_COMMAND"
                    },
                    {
                        description: i18n.__("commands.music.skipTo.slashSpecificDescription"),
                        name: "specific",
                        options: [
                            {
                                description: i18n.__("commands.music.skipTo.slashPositionDescription"),
                                name: "position",
                                required: true,
                                type: "NUMBER"
                            }
                        ],
                        type: "SUB_COMMAND"
                    }
                ]
            },
            usage: i18n.__("commands.music.skipTo.usage", { options: "first | last" })
        });
    }

    public async execute(ctx: CommandContext): Promise<Message|void> {
        if (!inVC(ctx)) return;
        if (!haveQueue(ctx)) return;
        if (!sameVC(ctx)) return;

        const djRole = await this.client.utils.fetchDJRole(ctx.guild!);
        if (!ctx.member?.roles.cache.has(djRole.id) && !ctx.member?.permissions.has("MANAGE_GUILD")) return ctx.reply({ embeds: [createEmbed("error", i18n.__("commands.music.skipTo.noPermission"), true)] });

        const targetType = (ctx.args[0] as string | undefined) ?? ctx.options?.getSubcommand() ?? ctx.options?.getNumber("position");
        if (!targetType) return ctx.reply({ embeds: [createEmbed("warn", i18n.__mf("reusable.invalidUsage", { prefix: `${this.client.config.mainPrefix}help`, name: `${this.meta.name}` }))] });

        const songs = [...ctx.guild!.queue!.songs.sortByIndex().values()];
        if (!["first", "last"].includes(String(targetType).toLowerCase()) && (!isNaN(Number(targetType)) && !songs[Number(targetType) - 1])) return ctx.reply({ embeds: [createEmbed("error", i18n.__("commands.music.skipTo.noSongPosition"), true)] });

        let song: IQueueSong;
        if (String(targetType).toLowerCase() === "first") {
            song = songs[0];
        } else if (String(targetType).toLowerCase() === "last") {
            song = songs[songs.length - 1];
        } else {
            song = songs[Number(targetType) - 1];
        }

        if (song.key === ((ctx.guild!.queue!.player!.state as AudioPlayerPlayingState).resource.metadata as IQueueSong).key) return ctx.reply({ embeds: [createEmbed("error", i18n.__("commands.music.skipTo.cantPlay"), true)] });

        void play(this.client, ctx.guild!, song.key);

        return ctx.reply({ embeds: [createEmbed("success", `⏭ **|** ${i18n.__mf("commands.music.skipTo.skipMessage", { song: `[${song.song.title}](${song.song.url})` })}`).setThumbnail(song.song.thumbnail)] });
    }
}
