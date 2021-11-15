import { BaseEvent } from "../structures/BaseEvent";
import { createEmbed } from "../utils/createEmbed";
import { entersState, VoiceConnectionStatus } from "@discordjs/voice";
import { GuildChannel, VoiceChannel } from "discord.js";
import i18n from "i18n";

export class ChannelUpdateEvent extends BaseEvent {
    public constructor(client: BaseEvent["client"]) {
        super(client, "channelUpdate");
    }

    public async execute(oldChannel: GuildChannel, newChannel: GuildChannel): Promise<void> {
        if (!newChannel.guild.queue || (newChannel.id !== newChannel.guild.queue.connection?.joinConfig.channelId) || (oldChannel.type !== "GUILD_VOICE" && oldChannel.type !== "GUILD_STAGE_VOICE") || (newChannel.type !== "GUILD_VOICE" && newChannel.type !== "GUILD_STAGE_VOICE")) return;

        if ((oldChannel as VoiceChannel).rtcRegion !== (newChannel as VoiceChannel).rtcRegion) {
            const queue = newChannel.guild.queue;

            const msg = await queue.textChannel.send({ embeds: [createEmbed("info", i18n.__("events.channelUpdate.reconfigureConnection"))] });
            queue.connection?.configureNetworking();

            entersState(queue.connection!, VoiceConnectionStatus.Ready, 20000)
                .then(() => {
                    void msg.edit({ embeds: [createEmbed("success", i18n.__("events.channelUpdate.connectionReconfigured"), true)] });
                })
                .catch(() => {
                    queue.destroy();
                    this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Unable to re-configure networking on ${newChannel.guild.name} voice channel, the queue was deleted.`);
                    void msg.edit({ embeds: [createEmbed("error", i18n.__("events.channelUpdate.unableReconfigureConnection"), true)] });
                });
        }
    }
}
