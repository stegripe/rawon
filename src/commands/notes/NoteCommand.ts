import { ApplicationCommandOptionType, bold } from "discord.js";
import { NoteMethods } from "../../database/methods/NoteMethods.js";
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

    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();

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
