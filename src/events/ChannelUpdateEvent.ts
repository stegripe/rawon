import { createEmbed } from "../utils/functions/createEmbed.js";
import { BaseEvent } from "../structures/BaseEvent.js";
import { Event } from "../utils/decorators/Event.js";
import { entersState, VoiceConnectionStatus } from "@discordjs/voice";
import { ChannelType, GuildChannel, VoiceChannel } from "discord.js";
import i18n from "i18n";

@Event("channelUpdate")
export class ChannelUpdateEvent extends BaseEvent {
    public async execute(oldChannel: GuildChannel, newChannel: GuildChannel): Promise<void> {
        this.client.debugLog.logData("info", "CHANNEL_UPDATE_EVENT", [
            ["Channel", `${newChannel.name}(${newChannel.id})`],
            ["Type", newChannel.type.toString()]
        ]);

        if (
            !newChannel.guild.queue ||
            newChannel.id !== newChannel.guild.queue.connection?.joinConfig.channelId ||
            (oldChannel.type !== ChannelType.GuildVoice && oldChannel.type !== ChannelType.GuildStageVoice) ||
            (newChannel.type !== ChannelType.GuildVoice && newChannel.type !== ChannelType.GuildStageVoice)
        )
            return;

        if ((oldChannel as VoiceChannel).rtcRegion !== (newChannel as VoiceChannel).rtcRegion) {
            const queue = newChannel.guild.queue;

            const msg = await queue.textChannel.send({
                embeds: [createEmbed("info", i18n.__("events.channelUpdate.reconfigureConnection"))]
            });
            queue.connection?.configureNetworking();

            entersState(queue.connection!, VoiceConnectionStatus.Ready, 20000)
                .then(() => {
                    void msg.edit({
                        embeds: [createEmbed("success", i18n.__("events.channelUpdate.connectionReconfigured"), true)]
                    });
                })
                .catch(() => {
                    queue.destroy();
                    this.client.logger.info(
                        `${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""
                        } Unable to re-configure network on ${newChannel.guild.name
                        } voice channel, the queue was deleted.`
                    );
                    void msg.edit({
                        embeds: [
                            createEmbed("error", i18n.__("events.channelUpdate.unableReconfigureConnection"), true)
                        ]
                    });
                });
        }
    }
}
