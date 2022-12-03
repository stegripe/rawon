import { ApplicationCommandOptionType, bold, time } from "discord.js";
import { NoteMethods } from "../../database/methods/NoteMethods.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

@Command<typeof NoteListCommand>({
    name: "notelist",
    description: "View notes",
    usage: "{prefix} notelist | {prefix} notelist <name>",
    slash: {
        name: "notelist",
        description: "View notes",
        options: [
            {
                name: "name",
                description: "View a specific note by providing name",
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    }
})
export class NoteListCommand extends BaseCommand {
    private readonly noteMethod = new NoteMethods(this.client);

    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();

        const options = {
            name: ctx.args[0] ?? ctx.options?.getString("name", true)
        };

        if (!options.name) {
            await ctx.send({ embeds: [createEmbed("warn", "Either provide note name or all option")] }, "editReply");
            return;
        }

        if (options.name === "all".toLowerCase()) {
            await this.returnAllNotes(ctx);
            return;
        }

        const note = await this.noteMethod.listNoteByNameAndUserId(options.name, ctx.author.id);

        if (note.length === 0) {
            await ctx.send(
                { embeds: [createEmbed("error", `No note with name ${bold(options.name)} found`)] },
                "editReply"
            );
            return;
        }

        const noteEmbed = createEmbed("success")
            .setAuthor({
                iconURL: ctx.author.displayAvatarURL({ extension: "png" }),
                name: ctx.author.username
            })
            .setTitle(options.name)
            .setDescription(`${bold("Content")}\n${note[0].noteValue}`)
            .addFields({
                name: "Created on",
                value: time(new Date(note[0].createdOn), "F")
            })
            .setTimestamp();

        await ctx.send({ embeds: [noteEmbed] }, "editReply");
    }

    private async returnAllNotes(ctx: CommandContext): Promise<void> {
        const notes = await this.noteMethod.listAllNotesByUserId(ctx.author.id);

        if (notes.length === 0) {
            await ctx.send({ embeds: [createEmbed("error", "No notes found")] }, "editReply");
            return;
        }

        const formattedNotes = notes.map(
            (e, index) =>
                `${++index}). ${bold(e.noteName)} :- ${
                    e.noteValue.length > 50 ? `${e.noteValue.substring(0, 50)}...` : e.noteValue
                }`
        );

        const notesEmbed = createEmbed("success")
            .setDescription(formattedNotes.join("\n"))
            .setAuthor({
                iconURL: ctx.author.displayAvatarURL({ extension: "png" }),
                name: `List of notes for ${ctx.author.username}`
            })
            .setFooter({
                iconURL: this.client.user?.displayAvatarURL({ extension: "png" }),
                text: `type ${this.client.config.mainPrefix} notes list <name> for more information`
            });

        await ctx.send({ embeds: [notesEmbed] }, "editReply");
    }
}
