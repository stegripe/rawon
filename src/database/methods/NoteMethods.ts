import { DeleteResult } from "typeorm";
import { Rawon } from "../../structures/Rawon.js";
import { Note } from "../entities/Note.js";

export class NoteMethods {
    private readonly noteRepository = this.client.database.db.getRepository(Note);

    public constructor(public client: Rawon) {}

    public async addNote(data: {
        name: string;
        value: string;
        guildId: string | undefined;
        userId: string;
    }): Promise<[] | [{ notename: string }]> {
        const note = await this.noteRepository
            .createQueryBuilder("notes")
            .insert()
            .values({
                name: data.name,
                value: data.value,
                userId: data.userId,
                guildId: data.guildId
            })
            .returning("notes.note_name as notename")
            .execute();

        return note.raw as [] | [{ notename: string }];
    }

    public async listAllNotesByUserId(userId: string): Promise<{ noteName: string; noteValue: string }[]> {
        const notes = (await this.noteRepository
            .createQueryBuilder("notes")
            .select("notes.note_name", "noteName")
            .addSelect("notes.note_value", "noteValue")
            .where("notes.user_id = :userId", { userId })
            .execute()) as { noteName: string; noteValue: string }[];

        return notes;
    }

    public async listNoteByNameAndUserId(
        name: string,
        userId: string
    ): Promise<{ noteName: string; noteValue: string; createdOn: string }[]> {
        const note = (await this.noteRepository
            .createQueryBuilder("notes")
            .select("notes.note_name", "noteName")
            .addSelect("notes.note_value", "noteValue")
            .addSelect("notes.created_on", "createdOn")
            .where("notes.note_name = :name", { name })
            .andWhere("notes.user_id = :userId", { userId })
            .execute()) as { noteName: string; noteValue: string; createdOn: string }[];

        return note;
    }

    public async deleteNoteByNameAndUserId(name: string, userId: string): Promise<DeleteResult> {
        const note = await this.noteRepository
            .createQueryBuilder("notes")
            .delete()
            .where("notes.note_name = :name", { name })
            .andWhere("notes.user_id = :userId", { userId })
            .execute();

        return note;
    }
}
