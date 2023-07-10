import { createEmbed } from "../functions/createEmbed.js";
import { Rawon } from "../../structures/Rawon.js";
import i18n from "../../config/index.js";
import { ChannelType, Guild, GuildBan, TextChannel, User } from "discord.js";

export class ModerationLogs {
    public constructor(public readonly client: Rawon) { }

    public async handleWarn(options: { author: User; guild: Guild; reason: string | null; user: User }): Promise<void> {
        const ch = await this.getCh(options.guild);
        if (!ch) return;

        const embed = createEmbed("warn", i18n.__mf("commands.moderation.warn.warnSuccess", { user: options.user.tag }))
            .setThumbnail(options.user.displayAvatarURL({ size: 1024 }))
            .addFields([
                {
                    name: i18n.__("commands.moderation.common.reasonString"),
                    value: options.reason ?? i18n.__("commands.moderation.common.noReasonString")
                }
            ])
            .setFooter({
                text: i18n.__mf("commands.moderation.warn.warnedByString", { author: options.author.tag }),
                iconURL: options.author.displayAvatarURL({})
            });

        await ch.send({ embeds: [embed] }).catch((er: Error) => console.log(`Failed to send warn logs: ${er.message}`));
    }

    public async handleBanAdd(options: { author?: User; ban: GuildBan }): Promise<void> {
        const fetched = await options.ban.fetch().catch(() => undefined);
        if (!fetched) return;

        const ch = await this.getCh(fetched.guild);
        if (!ch) return;

        const embed = createEmbed("error", i18n.__mf("commands.moderation.ban.banSuccess", { user: fetched.user.tag }))
            .setThumbnail(fetched.user.displayAvatarURL({ size: 1024 }))
            .addFields([
                {
                    name: i18n.__("commands.moderation.common.reasonString"),
                    value: fetched.reason ?? i18n.__("commands.moderation.common.noReasonString")
                }
            ]);

        if (options.author) {
            embed.setFooter({
                text: i18n.__mf("commands.moderation.ban.bannedByString", { author: options.author.tag }),
                iconURL: options.author.displayAvatarURL({})
            });
        }

        await ch.send({
            embeds: [embed]
        });
    }

    public async handleBanRemove(options: { author?: User; ban: GuildBan }): Promise<void> {
        const ch = await this.getCh(options.ban.guild);
        if (!ch) return;

        const embed = createEmbed(
            "info",
            i18n.__mf("commands.moderation.unban.unbanSuccess", { user: options.ban.user.tag })
        )
            .setThumbnail(options.ban.user.displayAvatarURL({ size: 1024 }))
            .addFields([
                {
                    name: i18n.__("commands.moderation.common.reasonString"),
                    value: options.ban.reason ?? i18n.__("commands.moderation.common.noReasonString")
                }
            ]);

        if (options.author) {
            embed.setFooter({
                text: i18n.__mf("commands.moderation.unban.unbannedByString", { author: options.author.tag }),
                iconURL: options.author.displayAvatarURL({})
            });
        }

        await ch.send({
            embeds: [embed]
        });
    }

    private async getCh(guild: Guild): Promise<TextChannel | undefined> {
        let ch: TextChannel | undefined;

        try {
            const modlog = this.client.data.data![guild.id]!.modLog;
            if (!modlog?.enable) throw new Error();

            const id = modlog.channel;
            const channel = await guild.channels.fetch(id!).catch(() => undefined);
            if (channel?.type !== ChannelType.GuildText) throw new Error();

            ch = channel;
        } catch {
            ch = undefined;
        }

        return ch;
    }
}
