/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

enum NoteType {
    MESSAGE = "message",
    EMBED = "embed"
}

@Entity({
    name: "notes"
})
export class Note {
    @PrimaryGeneratedColumn({
        name: "note_id"
    })
    id!: string;

    @Index()
    @Column({
        name: "note_name",
        type: "varchar",
        precision: 30
    })
    name!: string;

    @Column({
        name: "note_value",
        type: "varchar",
        precision: 2000
    })
    value!: string;

    @Index()
    @Column({
        name: "user_id",
        type: "varchar",
        precision: 20
    })
    userId!: string;

    @Column({
        name: "guild_id",
        type: "varchar",
        precision: 20
    })
    guildId!: string;

    @Column({
        name: "note_type",
        type: "enum",
        enum: NoteType,
        default: NoteType.MESSAGE
    })
    noteType!: NoteType;

    @CreateDateColumn({
        name: "created_on",
        type: "timestamp without time zone",
        default: () => "CURRENT_TIMESTAMP",
        insert: true
    })
    createdOn!: Date;

    @UpdateDateColumn({
        name: "updated_on",
        type: "timestamp without time zone",
        default: () => "CURRENT_TIMESTAMP",
        update: true,
        insert: true
    })
    updatedOn!: Date;
}
