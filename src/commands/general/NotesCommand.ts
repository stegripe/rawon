import { ApplicationCommandOptionType, bold, time } from "discord.js";
import { Note } from "../../database/entities/Note.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

@Command<typeof NotesCommand>({
    name: "notes",
    description: "List, Add or Remove note",
    usage: "{prefix}notes add <name> <value> | list [name] | remove <name>",
    slash: {
        name: "notes",
        description: "List, Add or Remove note",
        options: [
            {
                name: "list",
                description: "List all notes or list a specific note by name",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "name",
                        description: "Name of the note",
                        type: ApplicationCommandOptionType.String,
                        required: false
                    }
                ]
            },
            {
                name: "add",
                description: "Add note",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "name",
                        description: "Name of the note",
                        maxLength: 30,
                        type: ApplicationCommandOptionType.String,
                        required: true
                    },
                    {
                        name: "value",
                        description: "Value of the note",
                        type: ApplicationCommandOptionType.String,
                        maxLength: 2000,
                        required: true
                    }
                ]
            },
            {
                name: "remove",
                description: "Remove a note by name",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "name",
                        description: "Name of the note",
                        type: ApplicationCommandOptionType.String,
                        required: true
                    }
                ]
            }
        ]
    }
})
export class NotesCommand extends BaseCommand {
    private readonly noteRespository = this.client.database.db.getRepository(Note);

    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();

        const val = (ctx.args[0] ?? ctx.options?.getSubcommand()) as "add" | "list" | "remove" | undefined;

        if (!val || !["add", "remove", "list"].includes(val)) {
            const failEmbed = createEmbed("warn")
                .setDescription("Unknown option")
                .addFields([
                    {
                        name: "Supported options",
                        value: bold("add, list or remove")
                    },
                    {
                        name: "to add note use",
                        value: `${this.client.config.mainPrefix} notes add <name> <value>`
                    },
                    {
                        name: "to view all notes",
                        value: `${this.client.config.mainPrefix} notes list`
                    },
                    {
                        name: "to view specific note",
                        value: `${this.client.config.mainPrefix} notes list <name>`
                    },
                    {
                        name: "to remove specific note",
                        value: `${this.client.config.mainPrefix} notes remove <name>`
                    }
                ]);
            await ctx.send(
                {
                    embeds: [failEmbed]
                },
                "editReply"
            );
            return;
        }

        switch (val) {
            case "add":
                await this.addNote(ctx);
                break;

            case "list":
                await this.listNote(ctx);
                break;

            case "remove":
                await this.removeNote(ctx);
                break;

            default:
                break;
        }
    }

    private async addNote(ctx: CommandContext): Promise<void> {
        const options = {
            name: (ctx.args[1] ?? ctx.options?.getString("name", true)) as string | undefined,
            value: ctx.options?.getString("value", true) ?? ctx.args.slice(2).join(" ")
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

        const note = await this.noteRespository
            .createQueryBuilder("notes")
            .insert()
            .values({
                name: options.name,
                value: options.value,
                userId: ctx.author.id,
                guildId: ctx.guild?.id
            })
            .returning("notes.note_id")
            .execute();

        // eslint-disable-next-line @typescript-eslint/naming-convention
        if ((note.raw as [] | [{ note_id: string }]).length === 0) {
            await ctx.send({ embeds: [createEmbed("error", "Failed to save note, Please try again!")] }, "editReply");
            return;
        }

        await ctx.send(
            { embeds: [createEmbed("success", `Note ${bold(options.name)} saved successfully!`)] },
            "editReply"
        );
    }

    private async listNote(ctx: CommandContext): Promise<void> {
        const options = {
            name: (ctx.args[1] ?? ctx.options?.getString("name")) as string | undefined
        };

        if (!options.name) {
            const notes = await this.noteRespository
                .createQueryBuilder("notes")
                .select()
                .where("notes.user_id = :authorId", { authorId: ctx.author.id })
                .andWhere("notes.guild_id = :guildId", { guildId: ctx.guild?.id })
                .getMany();

            if (notes.length === 0) {
                await ctx.send(bold("No notes found on this server"), "editReply");
                return;
            }

            /**
             * @todo paginate notes
             */

            const formattedNotes = notes.map(
                (e, index) =>
                    `${++index}). ${bold(e.name)} :- ${
                        e.value.length > 50 ? `${e.value.substring(0, 50)}...` : e.value
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
            return;
        }

        const note = (await this.noteRespository
            .createQueryBuilder("notes")
            .select("notes.note_name", "name")
            .addSelect("notes.note_value", "value")
            .addSelect("notes.created_on", "createdOn")
            .where("notes.note_name = :name", { name: options.name })
            .andWhere("notes.user_id = :authorId", { authorId: ctx.author.id })
            .andWhere("notes.guild_id = :guildId", { guildId: ctx.guild?.id })
            .execute()) as Note[];

        if (note.length === 0) {
            await ctx.send(`No note with name ${bold(options.name)} found on this server`, "editReply");
            return;
        }

        const noteEmbed = createEmbed("success")
            .setAuthor({
                iconURL: ctx.author.displayAvatarURL({ extension: "png" }),
                name: `Extra info on ${note[0].name}`
            })
            .setTitle(options.name)
            .setDescription(`${bold("Content")}\n${note[0].value}`)
            .addFields({
                name: "Created on",
                value: time(note[0].createdOn, "F")
            })
            .setTimestamp();

        await ctx.send({ embeds: [noteEmbed] }, "editReply");
    }

    private async removeNote(ctx: CommandContext): Promise<void> {
        const options = {
            name: (ctx.args[1] ?? ctx.options?.getString("name", true)) as string | undefined
        };

        if (!options.name) {
            await ctx.send(
                {
                    embeds: [createEmbed("warn", "Note name is required")]
                },
                "editReply"
            );
            return;
        }

        const note = await this.noteRespository
            .createQueryBuilder("notes")
            .delete()
            .where("notes.note_name = :name", { name: options.name })
            .andWhere("notes.user_id = :authorId", { authorId: ctx.author.id })
            .andWhere("notes.guild_id = :guildId", { guildId: ctx.guild?.id })
            .execute();

        if (note.affected !== 1) {
            await ctx.send(`No note with name ${bold(options.name)} found on this server`, "editReply");
            return;
        }

        await ctx.send({ embeds: [createEmbed("success", `Note ${bold(options.name)} is deleted`)] }, "editReply");
    }
}
