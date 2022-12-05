import { ApplicationCommandOptionType, bold, roleMention } from "discord.js";
import { QueryFailedError } from "typeorm";
import { PermissionMethod } from "../../database/methods/PermissionMethod.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { memberReqPerms } from "../../utils/decorators/CommonUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

@Command<typeof NotePermission>({
    name: "notepermission",
    description: "Permissions for note command",
    slash: {
        name: "notepermission",
        description: "Permissions for note command",
        options: [
            {
                name: "set",
                description: "Set permission for note command",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "role",
                        description: "Select role",
                        type: ApplicationCommandOptionType.Role,
                        required: true
                    }
                ]
            },
            {
                name: "list",
                description: "List permissions for note command",
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                name: "unset",
                description: "Remove role for note command",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "role",
                        description: "Select role",
                        type: ApplicationCommandOptionType.Role,
                        required: true
                    }
                ]
            }
        ]
    }
})
export class NotePermission extends BaseCommand {
    private readonly permissionMethod = new PermissionMethod(this.client);

    @memberReqPerms(["Administrator"], "Sorry but this command is restricted to server admin only.")
    public async execute(ctx: CommandContext): Promise<void> {
        if (!ctx.isInteraction()) {
            await ctx.send("This command is restricted to slash command only", "editReply");
            return;
        }
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();

        const subCommand = ctx.options?.getSubcommand(true) as "list" | "set" | "unset";

        switch (subCommand) {
            case "set":
                await this.setPermission(ctx);
                break;

            case "unset":
                await this.unsetPermission(ctx);
                break;

            case "list":
                await this.listPermissions(ctx);
                break;

            default:
                break;
        }
    }

    private async unsetPermission(ctx: CommandContext): Promise<void> {
        const role = ctx.options?.getRole("role", true);
        if (!role) {
            await ctx.send("Role not found");
            return;
        }

        const permission = await this.permissionMethod.removePermissions(ctx.guild!.id, role.id);

        if (permission.affected === 0) {
            await ctx.send(
                {
                    embeds: [createEmbed("error", `Role ${roleMention(role.id)} not found`)]
                },
                "editReply"
            );
            return;
        }

        await ctx.send(
            {
                embeds: [createEmbed("success", `Role ${roleMention(role.id)} is successfully removed`)]
            },
            "editReply"
        );
    }

    private async listPermissions(ctx: CommandContext): Promise<void> {
        const permissions = await this.permissionMethod.getPermissions(ctx.guild!.id);

        if (permissions.length === 0) {
            await ctx.send(
                {
                    embeds: [createEmbed("error", "No roles found")]
                },
                "editReply"
            );
            return;
        }

        const permissionMessage = permissions.map(
            (role, index) => `${++index}). ${roleMention(role.roleId)} --> ${bold(role.roleId)}`
        );

        const embed = createEmbed("success")
            .setAuthor({
                iconURL: ctx.guild!.iconURL({ extension: "png" })!,
                name: ctx.guild!.name
            })
            .setDescription(permissionMessage.join("\n"))
            .setTimestamp();

        await ctx.send({
            embeds: [embed]
        });
    }

    private async setPermission(ctx: CommandContext): Promise<void> {
        const role = ctx.options?.getRole("role", true);
        if (!role) {
            await ctx.send("Role not found");
            return;
        }

        await this.permissionMethod
            .addPermission({ guildId: ctx.guild?.id, roleId: role.id })
            .then(async () => {
                await ctx.send(
                    {
                        embeds: [
                            createEmbed("success", `Role ${roleMention(role.id)} is now eligible to use notes command`)
                        ]
                    },
                    "editReply"
                );
            })
            .catch(async e => {
                if (e instanceof QueryFailedError) {
                    await ctx.send(
                        { embeds: [createEmbed("error", `Role ${roleMention(role.id)} already exists`)] },
                        "editReply"
                    );
                    return;
                }
                await ctx.send(
                    { embeds: [createEmbed("error", `Something went wrong, Please try again!`)] },
                    "editReply"
                );
            });
    }
}
