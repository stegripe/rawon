import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum PermissionTypes {
    TAGS = "tags",
    NOTES = "notes"
}

@Entity({
    name: "permissions"
})
export class Permission {
    @PrimaryGeneratedColumn({
        name: "permission_id"
    })
    public id!: string;

    @Index()
    @Column({
        name: "role_id",
        type: "varchar",
        precision: 20,
        unique: true
    })
    public roleId!: string;

    @Index()
    @Column({
        name: "guild_id",
        type: "varchar",
        precision: 20
    })
    public guildId!: string;

    @Column({
        name: "permission_type",
        type: "enum",
        enum: PermissionTypes
    })
    public type!: PermissionTypes;

    @CreateDateColumn({
        name: "created_on",
        type: "timestamp without time zone",
        default: () => "CURRENT_TIMESTAMP",
        insert: true
    })
    public createdOn!: Date;

    @UpdateDateColumn({
        name: "updated_on",
        type: "timestamp without time zone",
        default: () => "CURRENT_TIMESTAMP",
        update: true,
        insert: true
    })
    public updatedOn!: Date;
}
