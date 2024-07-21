import { ApplicationCommandOptionType } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { memberReqPerms } from "../../utils/decorators/CommonUtil.js";
import { chunk } from "../../utils/functions/chunk.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { formatTime } from "../../utils/functions/formatMS.js";
import { ButtonPagination } from "../../utils/structures/ButtonPagination.js";

@Command({
    contextUser: "Show user infractions",
    description: i18n.__("commands.moderation.infractions.description"),
    name: "infractions",
    slash: {
        options: [
            {
                description: i18n.__("commands.moderation.infractions.slashMemberDescription"),
                name: "member",
                required: false,
                type: ApplicationCommandOptionType.User
            }
        ]
    },
    usage: i18n.__("commands.moderation.infractions.usage")
})
export class InfractionsCommand extends BaseCommand {
    @memberReqPerms(["ManageGuild"], i18n.__("commands.moderation.warn.userNoPermission"))
    public async execute(ctx: CommandContext): Promise<void> {
        const user =
            ctx.guild?.members.resolve(ctx.args.shift()?.replace(/\D/gu, "") ?? "")?.user ??
            ctx.options?.getUser("member", false) ??
            ctx.author;
        const embed = createEmbed("info").setAuthor({
            name: i18n.__mf("commands.moderation.infractions.embedAuthorText", {
                user: user.tag
            })
        });
        let infractions: { on: number; reason: string | null }[];

        try {
            const temp = this.client.data.data?.[ctx.guild?.id ?? ""]?.infractions[user.id];
            if (!temp) throw new Error("...");
            infractions = temp;
        } catch {
            infractions = [];
        }

        if (infractions.length === 0) {
            await ctx.reply({
                embeds: [embed.setDescription(i18n.__("commands.moderation.infractions.noInfractions"))]
            });
            return;
        }

        const pages = await Promise.all(
            chunk(infractions, 10).map(async (st, ind) => {
                const infracts = await Promise.all(
                    st.map(
                        (inf, i) =>
                            `${ind * 10 + (i + 1)}. ${formatTime(inf.on)} - ${inf.reason ?? i18n.__("commands.moderation.common.noReasonString")
                            }`
                    )
                );

                return infracts.join("\n");
            })
        );
        const msg = await ctx.reply({
            embeds: [
                embed.setDescription(pages[0]).setFooter({
                    text: i18n.__mf("reusable.pageFooter", {
                        actual: 1,
                        total: pages.length
                    })
                })
            ]
        });

        await new ButtonPagination(msg, {
            author: ctx.author.id,
            edit: (i, emb, page) =>
                emb.setDescription(page).setFooter({
                    text: i18n.__mf("reusable.pageFooter", {
                        actual: i + 1,
                        total: pages.length
                    })
                }),
            embed,
            pages
        }).start();
    }
}
