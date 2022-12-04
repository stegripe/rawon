import { ApplicationCommandOptionType, bold } from "discord.js";
import { NoteMethods } from "../../database/methods/NoteMethods.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

@Command<typeof NoteAddCommand>({
    name: "noteadd",
    description: "Add note by providing name and value",
    usage: "{prefix} noteadd <name> <value>",
    slash: {
        name: "noteadd",
        description: "Add note by providing name and value",
        options: [
            {
                name: "name",
                description: "Name of the note",
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: "value",
                description: "Value of the note",
                type: ApplicationCommandOptionType.String,
                required: true,
                maxLength: 2000
            }
        ]
    }
})
export class NoteAddCommand extends BaseCommand {
    private readonly noteMethod = new NoteMethods(this.client);

    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();

        const options = {
            name: (ctx.args[0] ?? ctx.options?.getString("name", true)) as string | undefined,
            value: ctx.options?.getString("value", true) ?? ctx.args.slice(1).join(" ")
        };

        if (!options.name) {
            await ctx.send({ embeds: [createEmbed("warn", "Name is required")] }, "editReply");
            return;
        }
        if (options.name.length > 30) {
            await ctx.send(
                {
                    embeds: [createEmbed("warn", "Name length should be less than or equal to 30 character")]
                },
                "editReply"
            );
            return;
        }

        if (!options.value) {
            await ctx.send(
                { embeds: [createEmbed("warn", `Value is required for note ${bold(options.name)}`)] },
                "editReply"
            );
            return;
        }
        if (options.value.length > 2000) {
            await ctx.send(
                {
                    embeds: [createEmbed("warn", "Value length should be less than or equal to 2000 character")]
                },
                "editReply"
            );
            return;
        }

        const noteAlreadyExists = await this.noteMethod.listNoteByNameAndUserId(options.name, ctx.author.id);

        if (noteAlreadyExists.length > 0) {
            await ctx.send(
                { embeds: [createEmbed("error", `Note ${bold(options.name)} already exists`)] },
                "editReply"
            );
            return;
        }

        const note = await this.noteMethod.addNote({
            name: options.name,
            value: options.value,
            userId: ctx.author.id,
            guildId: ctx.guild?.id
        });

        if (note.length === 0) {
            await ctx.send(
                {
                    embeds: [createEmbed("error", "Failed to save note, Please try again!")]
                },
                "editReply"
            );
            return;
        }

        await ctx.send(
            { embeds: [createEmbed("success", `Note ${bold(note[0].notename)} saved successfully!`)] },
            "editReply"
        );
    }
}
