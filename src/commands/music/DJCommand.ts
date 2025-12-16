/* eslint-disable unicorn/filename-case */
import { ApplicationCommandOptionType } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { memberReqPerms } from "../../utils/decorators/CommonUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

@Command<typeof DJCommand>({
    description: i18n.__("commands.music.dj.description"),
    name: "dj",
    slash: {
        options: [
            {
                description: i18n.__("commands.music.dj.slashRoleDescription"),
                name: "role",
                options: [
                    {
                        description: i18n.__("commands.music.dj.slashRoleNewRoleOption"),
                        name: "newrole",
                        required: false,
                        type: ApplicationCommandOptionType.Role,
                    },
                ],
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                description: i18n.__("commands.music.dj.slashEnableDescription"),
                name: "enable",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                description: i18n.__("commands.music.dj.slashDisableDescription"),
                name: "disable",
                type: ApplicationCommandOptionType.Subcommand,
            },
        ],
    },
    usage: "{prefix}dj",
})
export class DJCommand extends BaseCommand {
    private readonly options: Record<string, BaseCommand["execute"]> = {
        // eslint-disable-next-line typescript/no-unsafe-return
        set: (ctx) => this.options.role(ctx),
        default: async (ctx) =>
            ctx.reply({
                embeds: [
                    createEmbed("info")
                        .setAuthor({
                            name: i18n.__("commands.music.dj.embedTitle"),
                        })
                        .addFields([
                            {
                                name: `${this.client.config.mainPrefix}dj enable`,
                                value: i18n.__("commands.music.dj.slashEnableDescription"),
                            },
                            {
                                name: `${this.client.config.mainPrefix}dj disable`,
                                value: i18n.__("commands.music.dj.slashDisableDescription"),
                            },
                            {
                                name: `${this.client.config.mainPrefix}dj role [${i18n.__(
                                    "commands.music.dj.newRoleText",
                                )}]`,
                                value: i18n.__("commands.music.dj.slashRoleDescription"),
                            },
                        ]),
                ],
            }),
        disable: async (ctx) => {
            await this.client.data.save(() => {
                const data = this.client.data.data;
                const guildData = data?.[ctx.guild?.id ?? ""];

                return {
                    ...data,
                    [ctx.guild?.id ?? "..."]: {
                        ...guildData,
                        dj: {
                            enable: false,
                            role: guildData?.dj?.role ?? null,
                        },
                    },
                };
            });

            return ctx.reply({
                embeds: [createEmbed("success", i18n.__("commands.music.dj.disableText"), true)],
            });
        },
        enable: async (ctx) => {
            await this.client.data.save(() => {
                const data = this.client.data.data;
                const guildData = data?.[ctx.guild?.id ?? ""];

                return {
                    ...data,
                    [ctx.guild?.id ?? "..."]: {
                        ...guildData,
                        dj: {
                            enable: true,
                            role: guildData?.dj?.role ?? null,
                        },
                    },
                };
            });

            return ctx.reply({
                embeds: [createEmbed("success", i18n.__("commands.music.dj.enableText"), true)],
            });
        },
        role: async (ctx) => {
            const newRole =
                ctx.options?.getRole("newrole")?.id ?? ctx.args.shift()?.replaceAll(/\D/gu, "");
            const txt =
                this.client.data.data?.[ctx.guild?.id ?? ""]?.dj?.enable === true
                    ? "enable"
                    : "disable";
            const footer = `${i18n.__("commands.music.dj.embedTitle")}: ${i18n.__(`commands.music.dj.${txt}`)}`;

            if ((newRole?.length ?? 0) === 0) {
                const cur = this.client.data.data?.[ctx.guild?.id ?? ""]?.dj?.role ?? null;

                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "info",
                            (cur?.length ?? 0) > 0
                                ? i18n.__mf("commands.music.dj.role.current", { cur })
                                : i18n.__("commands.music.dj.role.noRole"),
                        ).setFooter({
                            text: footer,
                        }),
                    ],
                });
            }

            const role = await ctx.guild?.roles.fetch(newRole ?? "")?.catch(() => void 0);
            if (!role) {
                return ctx.reply({
                    embeds: [createEmbed("error", i18n.__("commands.music.dj.role.invalid"), true)],
                });
            }

            await this.client.data.save(() => {
                const data = this.client.data.data;
                const guildData = data?.[ctx.guild?.id ?? ""];

                return {
                    ...data,
                    [ctx.guild?.id ?? "..."]: {
                        ...guildData,
                        dj: {
                            enable: guildData?.dj?.enable ?? false,
                            role: role.id,
                        },
                    },
                };
            });

            return ctx.reply({
                embeds: [
                    createEmbed(
                        "success",
                        i18n.__mf("commands.music.dj.role.success", { role: newRole }),
                        true,
                    ).setFooter({
                        text: footer,
                    }),
                ],
            });
        },
    };

    @memberReqPerms(["ManageGuild"], i18n.__("commands.music.dj.noPermission"))
    public execute(ctx: CommandContext): void {
        const subname = ctx.options?.getSubcommand() ?? ctx.args.shift();
        let sub = this.options[subname ?? ""] as BaseCommand["execute"] | undefined;

        sub ??= this.options.default;
        sub(ctx);
    }
}
