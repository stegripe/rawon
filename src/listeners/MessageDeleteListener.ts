import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, type ListenerOptions } from "@sapphire/framework";
import { type Message, type PartialMessage } from "discord.js";
import { type Rawon } from "../structures/Rawon.js";
import { type ExtendedDataManager } from "../typings/index.js";

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

@ApplyOptions<ListenerOptions>({ event: Events.MessageDelete })
export class MessageDeleteListener extends Listener<typeof Events.MessageDelete> {
    public async run(message: Message | PartialMessage): Promise<void> {
        if (!message.guild) {
            return;
        }

        const guild = message.guild;
        const botId = (message.client as Rawon).user?.id ?? "unknown";

        let requestChannelData: { channelId: string | null; messageId: string | null } | null =
            null;

        if (hasGetRequestChannel(this.container.data)) {
            requestChannelData = this.container.data.getRequestChannel(guild.id, botId);
        } else {
            requestChannelData =
                (this.container.data as any).data?.[guild.id]?.requestChannel ?? null;
        }

        if (requestChannelData?.messageId === message.id) {
            this.container.logger.info(
                `Request channel player message (${message.id}) was deleted in guild ${guild.name} (${guild.id}). Cleaning up request channel...`,
            );

            this.container.debugLog.logData("info", "MESSAGE_DELETE_EVENT", [
                ["MessageId", message.id],
                ["Guild", `${guild.name}(${guild.id})`],
                ["Reason", "Request channel player message deleted"],
            ]);

            try {
                await this.container.requestChannelManager.setRequestChannel(guild, null);
                this.container.logger.info(
                    `Cleaned up request channel data for guild ${guild.name} (${guild.id}) after player message deletion`,
                );
            } catch (error) {
                this.container.logger.error(
                    `Failed to clean up request channel data for guild ${guild.id}:`,
                    error,
                );
            }
        }
    }
}
