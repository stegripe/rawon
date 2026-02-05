import { setTimeout } from "node:timers";
import { entersState, VoiceConnectionStatus } from "@discordjs/voice";
import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, type ListenerOptions } from "@sapphire/framework";
import {
    ChannelType,
    type DMChannel,
    type NonThreadGuildBasedChannel,
    type VoiceChannel,
} from "discord.js";
import { type Rawon } from "../structures/Rawon.js";
import { createEmbed } from "../utils/functions/createEmbed.js";
import { i18n__ } from "../utils/functions/i18n.js";

@ApplyOptions<ListenerOptions>({ event: Events.ChannelUpdate })
export class ChannelUpdateListener extends Listener<typeof Events.ChannelUpdate> {
    public async run(
        oldChannel: DMChannel | NonThreadGuildBasedChannel,
        newChannel: DMChannel | NonThreadGuildBasedChannel,
    ): Promise<void> {
        if (oldChannel.isDMBased() || newChannel.isDMBased()) {
            return;
        }
        this.container.debugLog.logData("info", "CHANNEL_UPDATE_EVENT", [
            ["Channel", `${newChannel.name}(${newChannel.id})`],
            ["Type", newChannel.type.toString()],
        ]);

        if (
            !newChannel.guild.queue ||
            newChannel.id !== newChannel.guild.queue.connection?.joinConfig.channelId ||
            (oldChannel.type !== ChannelType.GuildVoice &&
                oldChannel.type !== ChannelType.GuildStageVoice) ||
            (newChannel.type !== ChannelType.GuildVoice &&
                newChannel.type !== ChannelType.GuildStageVoice)
        ) {
            return;
        }

        if ((oldChannel as VoiceChannel).rtcRegion !== (newChannel as VoiceChannel).rtcRegion) {
            const queue = newChannel.guild.queue;
            const client = newChannel.client as Rawon;
            const isRequestChannel = this.container.requestChannelManager.isRequestChannel(
                newChannel.guild,
                queue.textChannel.id,
            );

            const __ = i18n__(client, newChannel.guild);

            const msg = await queue.textChannel.send({
                embeds: [createEmbed("info", __("events.channelUpdate.reconfigureConnection"))],
            });
            queue.connection?.configureNetworking();

            await entersState(
                queue.connection as unknown as NonNullable<typeof queue.connection>,
                VoiceConnectionStatus.Ready,
                20_000,
            )
                .then(() => {
                    void msg.edit({
                        embeds: [
                            createEmbed(
                                "success",
                                __("events.channelUpdate.connectionReconfigured"),
                                true,
                            ),
                        ],
                    });
                    if (isRequestChannel) {
                        setTimeout(() => {
                            void msg.delete().catch(() => null);
                        }, 10_000);
                    }
                    return 0;
                })
                .catch(async () => {
                    await queue.destroy();
                    this.container.logger.info(
                        `${
                            client.shard ? `[Shard #${client.shard.ids[0]}]` : ""
                        } Unable to re-configure network on ${
                            newChannel.guild.name
                        } voice channel, the queue was deleted.`,
                    );
                    void msg.edit({
                        embeds: [
                            createEmbed(
                                "error",
                                __("events.channelUpdate.unableReconfigureConnection"),
                                true,
                            ),
                        ],
                    });
                    if (isRequestChannel) {
                        setTimeout(() => {
                            void msg.delete().catch(() => null);
                        }, 10_000);
                    }
                });
        }
    }
}
