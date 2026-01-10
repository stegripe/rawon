import { type Guild } from "discord.js";
import { BaseEvent } from "../structures/BaseEvent.js";
import { type ExtendedDataManager } from "../typings/index.js";
import { Event } from "../utils/decorators/Event.js";

function hasDeleteMethods(
    data: unknown,
): data is Pick<
    ExtendedDataManager,
    "deleteRequestChannel" | "deletePlayerState" | "deleteQueueState"
> {
    return (
        typeof data === "object" &&
        data !== null &&
        "deleteRequestChannel" in data &&
        typeof (data as ExtendedDataManager).deleteRequestChannel === "function" &&
        "deletePlayerState" in data &&
        typeof (data as ExtendedDataManager).deletePlayerState === "function" &&
        "deleteQueueState" in data &&
        typeof (data as ExtendedDataManager).deleteQueueState === "function"
    );
}

@Event("guildDelete")
export class GuildDeleteEvent extends BaseEvent {
    public async execute(guild: Guild): Promise<void> {
        this.client.debugLog.logData("info", "GUILD_DELETE_EVENT", [
            ["Guild", `${guild.name}(${guild.id})`],
        ]);

        this.client.logger.info(
            `Bot was removed from guild: ${guild.name} (${guild.id}). Cleaning up database...`,
        );

        const botId = this.client.user?.id ?? "unknown";

        try {
            if (hasDeleteMethods(this.client.data)) {
                const dataManager = this.client.data;

                await dataManager.deleteRequestChannel(guild.id, botId);
                this.client.logger.info(
                    `Deleted request channel data for guild ${guild.id} (bot ${botId})`,
                );

                await dataManager.deletePlayerState(guild.id, botId);
                this.client.logger.info(
                    `Deleted player state for guild ${guild.id} (bot ${botId})`,
                );

                await dataManager.deleteQueueState(guild.id, botId);
                this.client.logger.info(`Deleted queue state for guild ${guild.id} (bot ${botId})`);
            }

            if (guild.queue) {
                await guild.queue.destroy();
                this.client.logger.info(`Destroyed queue for guild ${guild.id}`);
            }

            this.client.logger.info(
                `Successfully cleaned up all data for removed guild: ${guild.name} (${guild.id})`,
            );
        } catch (error) {
            this.client.logger.error(`Failed to clean up database for guild ${guild.id}:`, error);
        }
    }
}
