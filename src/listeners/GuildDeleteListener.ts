import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, type ListenerOptions } from "@sapphire/framework";
import { type Guild } from "discord.js";
import { type Rawon } from "../structures/Rawon.js";
import { type ExtendedDataManager } from "../typings/index.js";

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

@ApplyOptions<ListenerOptions>({ event: Events.GuildDelete })
export class GuildDeleteListener extends Listener<typeof Events.GuildDelete> {
    public async run(guild: Guild): Promise<void> {
        this.container.debugLog.logData("info", "GUILD_DELETE_EVENT", [
            ["Guild", `${guild.name}(${guild.id})`],
        ]);

        this.container.logger.info(
            `Bot was removed from guild: ${guild.name} (${guild.id}). Cleaning up database...`,
        );

        const botId = (guild.client as Rawon).user?.id ?? "unknown";

        try {
            if (hasDeleteMethods(this.container.data)) {
                const dataManager = this.container.data;

                await dataManager.deleteRequestChannel(guild.id, botId);
                this.container.logger.info(
                    `Deleted request channel data for guild ${guild.id} (bot ${botId})`,
                );

                await dataManager.deletePlayerState(guild.id, botId);
                this.container.logger.info(
                    `Deleted player state for guild ${guild.id} (bot ${botId})`,
                );

                await dataManager.deleteQueueState(guild.id, botId);
                this.container.logger.info(
                    `Deleted queue state for guild ${guild.id} (bot ${botId})`,
                );
            }

            if (guild.queue) {
                await guild.queue.destroy();
                this.container.logger.info(`Destroyed queue for guild ${guild.id}`);
            }

            this.container.logger.info(
                `Successfully cleaned up all data for removed guild: ${guild.name} (${guild.id})`,
            );
        } catch (error) {
            this.container.logger.error(
                `Failed to clean up database for guild ${guild.id}:`,
                error,
            );
        }
    }
}
