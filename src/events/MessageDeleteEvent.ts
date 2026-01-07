import { type Message, type PartialMessage } from "discord.js";
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

@Event("messageDelete")
export class MessageDeleteEvent extends BaseEvent {
    public async execute(message: Message | PartialMessage): Promise<void> {
        if (!message.guild) {
            return;
        }

        const guild = message.guild;
        const botId = this.client.user?.id ?? "unknown";

        let requestChannelData: { channelId: string | null; messageId: string | null } | null =
            null;

        if (hasGetRequestChannel(this.client.data)) {
            requestChannelData = this.client.data.getRequestChannel(guild.id, botId);
        } else {
            requestChannelData = this.client.data.data?.[guild.id]?.requestChannel ?? null;
        }

        if (requestChannelData?.messageId === message.id) {
            this.client.logger.info(
                `Request channel player message (${message.id}) was deleted in guild ${guild.name} (${guild.id}). Cleaning up request channel...`,
            );

            this.client.debugLog.logData("info", "MESSAGE_DELETE_EVENT", [
                ["MessageId", message.id],
                ["Guild", `${guild.name}(${guild.id})`],
                ["Reason", "Request channel player message deleted"],
            ]);

            try {
                await this.client.requestChannelManager.setRequestChannel(guild, null);
                this.client.logger.info(
                    `Cleaned up request channel data for guild ${guild.name} (${guild.id}) after player message deletion`,
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
