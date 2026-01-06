import { type Guild } from "discord.js";
import { BaseEvent } from "../structures/BaseEvent.js";
import { Event } from "../utils/decorators/Event.js";

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
            // Delete request channel data
            if (
                "deleteRequestChannel" in this.client.data &&
                typeof this.client.data.deleteRequestChannel === "function"
            ) {
                await (this.client.data as any).deleteRequestChannel(guild.id, botId);
                this.client.logger.info(
                    `Deleted request channel data for guild ${guild.id} (bot ${botId})`,
                );
            }

            // Delete player state
            if (
                "deletePlayerState" in this.client.data &&
                typeof this.client.data.deletePlayerState === "function"
            ) {
                await (this.client.data as any).deletePlayerState(guild.id, botId);
                this.client.logger.info(
                    `Deleted player state for guild ${guild.id} (bot ${botId})`,
                );
            }

            // Delete queue state
            if (
                "deleteQueueState" in this.client.data &&
                typeof this.client.data.deleteQueueState === "function"
            ) {
                await (this.client.data as any).deleteQueueState(guild.id, botId);
                this.client.logger.info(`Deleted queue state for guild ${guild.id} (bot ${botId})`);
            }

            // Clean up the queue if it exists
            if (guild.queue) {
                guild.queue.destroy();
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
