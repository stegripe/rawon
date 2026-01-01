import { ApplicationCommandOptionType } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { memberReqPerms } from "../../utils/decorators/CommonUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";

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
    @memberReqPerms(["ManageGuild"], i18n.__("commands.music.dj.noPermission"))
    public execute(ctx: CommandContext): void {
        const __ = i18n__(this.client, ctx.guild);
        const __mf = i18n__mf(this.client, ctx.guild);

        const options: Record<string, () => void> = {
            set: () => options.role(),
            default: () => {
                void ctx.reply({
                    embeds: [
                        createEmbed("info")
                            .setAuthor({
                                name: __("commands.music.dj.embedTitle"),
                            })
                            .addFields([
                                {
                                    name: `${this.client.config.mainPrefix}dj enable`,
                                    value: __("commands.music.dj.slashEnableDescription"),
                                },
                                {
                                    name: `${this.client.config.mainPrefix}dj disable`,
                                    value: __("commands.music.dj.slashDisableDescription"),
                                },
                                {
                                    name: `${this.client.config.mainPrefix}dj role [${__(
                                        "commands.music.dj.newRoleText",
                                    )}]`,
                                    value: __("commands.music.dj.slashRoleDescription"),
                                },
                            ]),
                    ],
                });
            },
            disable: async () => {
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
                    embeds: [createEmbed("success", __("commands.music.dj.disableText"), true)],
                });
            },
            enable: async () => {
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
                    embeds: [createEmbed("success", __("commands.music.dj.enableText"), true)],
                });
            },
            role: async () => {
                const newRole =
                    ctx.options?.getRole("newrole")?.id ?? ctx.args.shift()?.replaceAll(/\D/gu, "");
                const txt =
                    this.client.data.data?.[ctx.guild?.id ?? ""]?.dj?.enable === true
                        ? "enable"
                        : "disable";
                const footer = `${__("commands.music.dj.embedTitle")}: ${__(`commands.music.dj.${txt}`)}`;

                if ((newRole?.length ?? 0) === 0) {
                    const cur = this.client.data.data?.[ctx.guild?.id ?? ""]?.dj?.role ?? null;

                    return ctx.reply({
                        embeds: [
                            createEmbed(
                                "info",
                                (cur?.length ?? 0) > 0
                                    ? __mf("commands.music.dj.role.current", { role: cur })
                                    : __mf("commands.music.dj.role.noRole", {
                                          prefix: this.client.config.mainPrefix,
                                      }),
                            ).setFooter({
                                text: footer,
                            }),
                        ],
                    });
                }

                const role = await ctx.guild?.roles.fetch(newRole ?? "")?.catch(() => void 0);
                if (!role) {
                    return ctx.reply({
                        embeds: [createEmbed("error", __("commands.music.dj.role.invalid"), true)],
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
                            __mf("commands.music.dj.role.success", { role: newRole }),
                            true,
                        ).setFooter({
                            text: footer,
                        }),
                    ],
                });
            },
        };

        const subname = ctx.options?.getSubcommand() ?? ctx.args.shift();
        let sub = options[subname ?? ""] as (() => void) | undefined;

        sub ??= options.default;
        sub();
    }
}
