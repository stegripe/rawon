import { ChannelType, type DMChannel, type GuildChannel } from "discord.js";
import { BaseEvent } from "../structures/BaseEvent.js";
import { type ExtendedDataManager } from "../typings/index.js";
import { Event } from "../utils/decorators/Event.js";

function hasGetRequestChannel(
    data: unknown,
): data is Pick<ExtendedDataManager, "getRequestChannel"> {
    return (
        typeof data === "object" &&
        data !== null &&
        "getRequestChannel" in data &&
        typeof (data as ExtendedDataManager).getRequestChannel === "function"
    );
}

@Event("channelDelete")
export class ChannelDeleteEvent extends BaseEvent {
    public async execute(channel: DMChannel | GuildChannel): Promise<void> {
        if (channel.type === ChannelType.DM) {
            return;
        }

        if (channel.type !== ChannelType.GuildText) {
            return;
        }

        const guild = channel.guild;
        const botId = this.client.user?.id ?? "unknown";

        this.client.debugLog.logData("info", "CHANNEL_DELETE_EVENT", [
            ["Channel", `${channel.name}(${channel.id})`],
            ["Guild", `${guild.name}(${guild.id})`],
        ]);

        let requestChannelData: { channelId: string | null; messageId: string | null } | null =
            null;

        if (hasGetRequestChannel(this.client.data)) {
            requestChannelData = this.client.data.getRequestChannel(guild.id, botId);
        } else {
            requestChannelData = this.client.data.data?.[guild.id]?.requestChannel ?? null;
        }

        if (requestChannelData?.channelId === channel.id) {
            this.client.logger.info(
                `Request channel ${channel.name} (${channel.id}) was deleted in guild ${guild.name} (${guild.id}). Cleaning up...`,
            );

            try {
                await this.client.requestChannelManager.setRequestChannel(guild, null);
                this.client.logger.info(
                    `Cleaned up request channel data for deleted channel in guild ${guild.name} (${guild.id})`,
                );
            } catch (error) {
                this.client.logger.error(
                    `Failed to clean up request channel data for guild ${guild.id}:`,
                    error,
                );
            }
        }
    }
}
