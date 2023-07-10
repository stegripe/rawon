import { memberReqPerms } from "../../utils/decorators/CommonUtil.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import i18n from "../../config/index.js";
import { ApplicationCommandOptionType, ChannelType } from "discord.js";

@Command<typeof ModLogsCommand>({
    aliases: ["modlog", "moderationlogs", "moderationlog"],
    description: i18n.__("commands.moderation.modlogs.description"),
    name: "modlogs",
    slash: {
        options: [
            {
                description: i18n.__("commands.moderation.modlogs.slashChannelDescription"),
                name: "channel",
                options: [
                    {
                        description: i18n.__("commands.moderation.modlogs.slashChannelNewChannelOption"),
                        name: "newchannel",
                        required: false,
                        type: ApplicationCommandOptionType.Channel
                    }
                ],
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                description: i18n.__("commands.moderation.modlogs.slashEnableDescription"),
                name: "enable",
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                description: i18n.__("commands.moderation.modlogs.slashDisableDescription"),
                name: "disable",
                type: ApplicationCommandOptionType.Subcommand
            }
        ]
    },
    usage: i18n.__("commands.moderation.modlogs.usage")
})
export class ModLogsCommand extends BaseCommand {
    private readonly options: Record<string, BaseCommand["execute"]> = {
        channel: async ctx => {
            const newCh = ctx.options?.getChannel("newchannel")?.id ?? ctx.args.shift()?.replace(/[^0-9]/g, "");

            if (!newCh) {
                let ch: string | null;

                try {
                    ch = this.client.data.data?.[ctx.guild?.id ?? ""]?.modLog?.channel ?? null;
                    if (!ch) throw new Error("");
                } catch {
                    ch = null;
                }

                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "info",
                            ch
                                ? i18n.__mf("commands.moderation.modlogs.channel.current", { channel: ch })
                                : i18n.__("commands.moderation.modlogs.channel.noChannel")
                        )
                    ]
                });
            }

            const ch = await ctx.guild?.channels.fetch(newCh).catch(() => undefined);
            if (ch?.type !== ChannelType.GuildText) {
                return ctx.reply({
                    embeds: [createEmbed("error", i18n.__("commands.moderation.modlogs.channel.invalid"))]
                });
            }

            await this.client.data.save(() => {
                const data = this.client.data.data;
                const guildData = data?.[ctx.guild?.id ?? ""];

                return {
                    ...(data ?? {}),
                    [ctx.guild!.id]: {
                        ...(guildData ?? {}),
                        infractions: guildData?.infractions ?? {},
                        modLog: {
                            channel: newCh,
                            enable: guildData?.modLog?.enable ?? false
                        }
                    }
                };
            });

            return ctx.reply({
                embeds: [
                    createEmbed(
                        "success",
                        i18n.__mf("commands.moderation.modlogs.channel.success", { channel: newCh }),
                        true
                    )
                ]
            });
        },
        default: ctx =>
            ctx.reply({
                embeds: [
                    createEmbed("info")
                        .setAuthor({
                            name: i18n.__("commands.moderation.modlogs.embedTitle")
                        })
                        .addFields([
                            {
                                name: `${this.client.config.mainPrefix}modlogs enable`,
                                value: i18n.__("commands.moderation.modlogs.slashEnableDescription")
                            },
                            {
                                name: `${this.client.config.mainPrefix}modlogs disable`,
                                value: i18n.__("commands.moderation.modlogs.slashDisableDescription")
                            },
                            {
                                name: `${this.client.config.mainPrefix}modlogs channel [${i18n.__(
                                    "commands.moderation.modlogs.newChannelText"
                                )}]`,
                                value: i18n.__("commands.moderation.modlogs.slashChannelDescription")
                            }
                        ])
                ]
            }),
        disable: async ctx => {
            await this.client.data.save(() => {
                const data = this.client.data.data;
                const guildData = data?.[ctx.guild?.id ?? ""];

                return {
                    ...(data ?? {}),
                    [ctx.guild!.id]: {
                        ...(guildData ?? {}),
                        infractions: guildData?.infractions ?? {},
                        modLog: {
                            channel: guildData?.modLog?.channel ?? null,
                            enable: false
                        }
                    }
                };
            });

            return ctx.reply({
                embeds: [createEmbed("success", i18n.__("commands.moderation.modlogs.disable"), true)]
            });
        },
        enable: async ctx => {
            await this.client.data.save(() => {
                const data = this.client.data.data;
                const guildData = data?.[ctx.guild?.id ?? ""];

                return {
                    ...(data ?? {}),
                    [ctx.guild!.id]: {
                        ...(guildData ?? {}),
                        infractions: guildData?.infractions ?? {},
                        modLog: {
                            channel: guildData?.modLog?.channel ?? null,
                            enable: true
                        }
                    }
                };
            });

            return ctx.reply({
                embeds: [createEmbed("success", i18n.__("commands.moderation.modlogs.enable"), true)]
            });
        }
    };

    @memberReqPerms(["ManageGuild"], i18n.__("commands.moderation.warn.userNoPermission"))
    public execute(ctx: CommandContext): void {
        const subname = ctx.options?.getSubcommand() ?? ctx.args.shift();
        let sub = this.options[subname!] as BaseCommand["execute"] | undefined;

        if (!sub) sub = this.options.default;
        sub(ctx);
    }
}
