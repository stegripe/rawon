import { ApplicationCommandOptionType, bold } from "discord.js";
import { Note } from "../../database/entities/Note.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

@Command<typeof NoteCommand>({
    name: "note",
    description: "Display note content",
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
    private readonly noteRespository = this.client.database.db.getRepository(Note);

    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();

        const options = {
            name: (ctx.args[0] ?? ctx.options?.getString("name", true)) as string | undefined
        };
        if (!options.name) {
            await ctx.send({ embeds: [createEmbed("warn", "Name is required")] }, "editReply");
            return;
        }

        const note = (await this.noteRespository
            .createQueryBuilder("notes")
            .select("notes.note_value", "value")
            .where("notes.note_name = :name", { name: options.name })
            .andWhere("notes.user_id = :authorId", { authorId: ctx.author.id })
            .andWhere("notes.guild_id = :guildId", { guildId: ctx.guild?.id })
            .execute()) as [] | [{ value: string }];
        if (note.length === 0) {
            await ctx.send(`No note with name ${bold(options.name)} found on this server`, "editReply");
            return;
        }

        await ctx.send({ content: note[0].value }, "editReply");
    }
}
