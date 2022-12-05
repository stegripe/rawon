import { DeleteResult, InsertResult } from "typeorm";
import { Rawon } from "../../structures/Rawon.js";
import { Permission, PermissionTypes } from "../entities/Permission.js";

export class PermissionMethod {
    private readonly permissionRepository = this.client.database.db.getRepository(Permission);

    public constructor(private readonly client: Rawon) {}

    public async addPermission(data: { guildId: string | undefined; roleId: string }): Promise<InsertResult> {
        const permission = await this.permissionRepository
            .createQueryBuilder("permissions")
            .insert()
            .values({
                guildId: data.guildId,
                roleId: data.roleId,
                type: PermissionTypes.NOTES
            })
            .returning("permissions.permission_id as permissionId")
            .execute();

        return permission;
    }

    public async getPermissions(guildId: string): Promise<{ roleId: string }[] | []> {
        const permission = await this.permissionRepository
            .createQueryBuilder("permissions")
            .select("permissions.role_id", "roleId")
            .where("permissions.guild_id = :guildId", { guildId })
            .cache(60 * 1000)
            .execute();

        return permission as { roleId: string }[] | [];
    }

    public async removePermissions(guildId: string, roleId: string): Promise<DeleteResult> {
        const permission = await this.permissionRepository
            .createQueryBuilder("permissions")
            .delete()
            .where("permissions.guild_id = :guildId", { guildId })
            .andWhere("permissions.role_id = :roleId", { roleId })
            .execute();

        return permission;
    }
}
