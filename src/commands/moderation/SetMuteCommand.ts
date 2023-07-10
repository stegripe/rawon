import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import i18n from "../../config/index.js";
import { ApplicationCommandOptionType } from "discord.js";

@Command({
    aliases: ["setmuterole"],
    description: i18n.__("commands.moderation.setmute.description"),
    name: "setmute",
    slash: {
        options: [
            {
                description: i18n.__("commands.moderation.setmute.slashRoleDescription"),
                name: "role",
                type: ApplicationCommandOptionType.Role,
                required: true
            }
        ]
    },
    usage: i18n.__("commands.moderation.setmute.usage")
})
export class SetMuteCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        const id = ctx.options?.getRole("role", true).id ?? ctx.args[0].replace(/\D/g, "");
        if (!id) {
            await ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.moderation.setmute.invalidRole"))]
            });

            return;
        }

        const role = await ctx.guild?.roles.fetch(id).catch(() => undefined);
        if (!role) {
            await ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.moderation.setmute.invalidRole"))]
            });

            return;
        }

        await this.client.data.save(() => {
            const data = this.client.data.data;
            const guildData = data?.[ctx.guild?.id ?? ""];

            return {
                ...(data ?? {}),
                [ctx.guild!.id]: {
                    ...(guildData ?? {}),
                    infractions: guildData?.infractions ?? {},
                    mute: role.id
                }
            };
        });
        await ctx.reply({
            embeds: [createEmbed("success", i18n.__mf("commands.moderation.setmute.success", { role: role.id }))]
        });
    }
}
