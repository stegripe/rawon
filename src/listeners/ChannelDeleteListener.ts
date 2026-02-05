import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, type ListenerOptions } from "@sapphire/framework";
import { ChannelType, type DMChannel, type GuildChannel } from "discord.js";
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

@ApplyOptions<ListenerOptions>({ event: Events.ChannelDelete })
export class ChannelDeleteListener extends Listener<typeof Events.ChannelDelete> {
    public async run(channel: DMChannel | GuildChannel): Promise<void> {
        if (channel.type === ChannelType.DM) {
            return;
        }

        if (channel.type !== ChannelType.GuildText) {
            return;
        }

        const guild = channel.guild;
        const botId = (this.container.client as Rawon).user?.id ?? "unknown";

        this.container.debugLog.logData("info", "CHANNEL_DELETE_EVENT", [
            ["Channel", `${channel.name}(${channel.id})`],
            ["Guild", `${guild.name}(${guild.id})`],
        ]);

        let requestChannelData: { channelId: string | null; messageId: string | null } | null =
            null;

        if (hasGetRequestChannel(this.container.data)) {
            requestChannelData = this.container.data.getRequestChannel(guild.id, botId);
        } else {
            requestChannelData =
                (this.container.data as any).data?.[guild.id]?.requestChannel ?? null;
        }

        if (requestChannelData?.channelId === channel.id) {
            this.container.logger.info(
                `Request channel ${channel.name} (${channel.id}) was deleted in guild ${guild.name} (${guild.id}). Cleaning up...`,
            );

            try {
                await this.container.requestChannelManager.setRequestChannel(guild, null);
                this.container.logger.info(
                    `Cleaned up request channel data for deleted channel in guild ${guild.name} (${guild.id})`,
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
