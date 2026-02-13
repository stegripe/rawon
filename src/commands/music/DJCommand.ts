/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import i18n from "../../config/index.js";
import { type CommandContext as LocalCommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { memberReqPerms } from "../../utils/decorators/CommonUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";

@ApplyOptions<Command.Options>({
    name: "dj",
    aliases: [],
    description: i18n.__("commands.music.dj.description"),
    detailedDescription: { usage: i18n.__("commands.music.dj.usage") },
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
            .setName(opts.name ?? "dj")
            .setDescription(opts.description ?? "Change DJ feature settings.")
            .addSubcommand((sub) =>
                sub
                    .setName("role")
                    .setDescription(i18n.__("commands.music.dj.slashRoleDescription"))
                    .addRoleOption((opt) =>
                        opt
                            .setName("newrole")
                            .setDescription(i18n.__("commands.music.dj.slashRoleNewRoleOption"))
                            .setRequired(false),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("enable")
                    .setDescription(i18n.__("commands.music.dj.slashEnableDescription")),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("disable")
                    .setDescription(i18n.__("commands.music.dj.slashDisableDescription")),
            ) as SlashCommandBuilder;
    },
})
export class DJCommand extends ContextCommand {
    private getClient(ctx: CommandContext): Rawon {
        return ctx.client as Rawon;
    }

    @memberReqPerms(["ManageGuild"], i18n.__("commands.music.dj.noPermission"))
    public contextRun(ctx: CommandContext): void {
        const localCtx = ctx as unknown as LocalCommandContext;
        const client = this.getClient(ctx);
        const __ = i18n__(client, ctx.guild);
        const __mf = i18n__mf(client, ctx.guild);

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
                                    name: `${client.config.mainPrefix}dj enable`,
                                    value: __("commands.music.dj.slashEnableDescription"),
                                },
                                {
                                    name: `${client.config.mainPrefix}dj disable`,
                                    value: __("commands.music.dj.slashDisableDescription"),
                                },
                                {
                                    name: `${client.config.mainPrefix}dj role [${__(
                                        "commands.music.dj.newRoleText",
                                    )}]`,
                                    value: __("commands.music.dj.slashRoleDescription"),
                                },
                            ]),
                    ],
                });
            },
            disable: async () => {
                await client.data.save(() => {
                    const data = client.data.data;
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
                await client.data.save(() => {
                    const data = client.data.data;
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
                    localCtx.options?.getRole("newrole")?.id ??
                    localCtx.args.shift()?.replaceAll(/\D/gu, "");
                const txt =
                    client.data.data?.[ctx.guild?.id ?? ""]?.dj?.enable === true
                        ? "enable"
                        : "disable";
                const footer = `• ${__("commands.music.dj.embedTitle")}: ${__(`commands.music.dj.${txt}`)}`;

                if ((newRole?.length ?? 0) === 0) {
                    const cur = client.data.data?.[ctx.guild?.id ?? ""]?.dj?.role ?? null;

                    return ctx.reply({
                        embeds: [
                            createEmbed(
                                "info",
                                (cur?.length ?? 0) > 0
                                    ? __mf("commands.music.dj.role.current", { role: cur })
                                    : __mf("commands.music.dj.role.noRole", {
                                          prefix: client.config.mainPrefix,
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

                await client.data.save(() => {
                    const data = client.data.data;
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

        const subname = localCtx.options?.getSubcommand() ?? localCtx.args.shift();
        let sub = options[subname ?? ""] as (() => void) | undefined;

        sub ??= options.default;
        sub();
    }
}
