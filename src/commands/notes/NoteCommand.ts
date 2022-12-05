import { ApplicationCommandOptionType, bold } from "discord.js";
import { NoteMethods } from "../../database/methods/NoteMethods.js";
import { PermissionMethod } from "../../database/methods/PermissionMethod.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

@Command<typeof NoteCommand>({
    name: "note",
    description: "Display note content",
    aliases: ["n"],
    usage: "{prefix}note name",
    slash: {
        name: "note",
        description: "Display note content",
        options: [
            {
                name: "name",
                description: "Name of the note",
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    }
})
export class NoteCommand extends BaseCommand {
    private readonly noteRespository = new NoteMethods(this.client);
    private readonly permissionMethod = new PermissionMethod(this.client);

    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();

        const permissions = await this.permissionMethod.getPermissions(ctx.guild!.id);

        if (permissions.length === 0) {
            await ctx.send({ embeds: [createEmbed("warn", "Note permission has not setuped yet")] }, "editReply");
            return;
        }

        const userInGuild = await ctx.guild?.members.fetch(ctx.author.id);

        const isEligible = permissions.some(permission => {
            const getUserRole = userInGuild?.roles.cache.find(role => permission.roleId === role.id);

            if (getUserRole) {
                return true;
            }

            return false;
        });

        if (!isEligible) {
            await ctx.send(
                {
                    embeds: [
                        createEmbed(
                            "warn",
                            "You are not eligible to use notes feature, Please ask admin for appropriate role"
                        )
                    ]
                },
                "editReply"
            );
            return;
        }

        const options = {
            name: (ctx.args[0] ?? ctx.options?.getString("name", true)) as string | undefined
        };
        if (!options.name) {
            await ctx.send({ embeds: [createEmbed("warn", "Name is required")] }, "editReply");
            return;
        }

        const note = await this.noteRespository.listNoteByNameAndUserId(options.name, ctx.author.id);

        if (note.length === 0) {
            await ctx.send(
                { embeds: [createEmbed("error", `No note with name ${bold(options.name)} found`)] },
                "editReply"
            );
            return;
        }

        await ctx.send({ content: note[0].noteValue }, "editReply");
    }
}
