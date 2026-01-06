import { ChannelType, type DMChannel, type GuildChannel } from "discord.js";
import { BaseEvent } from "../structures/BaseEvent.js";
import { Event } from "../utils/decorators/Event.js";

@Event("channelDelete")
export class ChannelDeleteEvent extends BaseEvent {
    public async execute(channel: DMChannel | GuildChannel): Promise<void> {
        // Ignore DM channels
        if (channel.type === ChannelType.DM) {
            return;
        }

        // Only handle text channels
        if (channel.type !== ChannelType.GuildText) {
            return;
        }

        const guild = channel.guild;
        const botId = this.client.user?.id ?? "unknown";

        this.client.debugLog.logData("info", "CHANNEL_DELETE_EVENT", [
            ["Channel", `${channel.name}(${channel.id})`],
            ["Guild", `${guild.name}(${guild.id})`],
        ]);

        // Check if this was a request channel
        let requestChannelData: { channelId: string | null; messageId: string | null } | null =
            null;

        if (
            "getRequestChannel" in this.client.data &&
            typeof this.client.data.getRequestChannel === "function"
        ) {
            requestChannelData = (this.client.data as any).getRequestChannel(guild.id, botId);
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
