import { Snowflake, TextChannel, Collection, GuildMember } from "discord.js";
import { formatMS } from "../utils/formatMS";
import { IVoiceState } from "../../typings";
import { DefineListener } from "../utils/decorators/DefineListener";
import { createEmbed } from "../utils/createEmbed";
import { BaseListener } from "../structures/BaseListener";

@DefineListener("voiceStateUpdate")
export class VoiceStateUpdateEvent extends BaseListener {
    public execute(oldState: IVoiceState, newState: IVoiceState): any {
        if (newState.guild.queue) {
            const oldID = oldState.channel ? oldState.channel.id : undefined;
            const newID = newState.channel ? newState.channel.id : undefined;
            const musicVcID = newState.guild.queue.voiceChannel?.id;

            // Handle when bot gets kicked from the voice channel
            if (oldState.id === this.client.user?.id && oldID === newState.guild.queue.voiceChannel?.id && newID === undefined) {
                try {
                    this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Disconnected from a voice channel at ${newState.guild.name}, queue deleted.`);
                    newState.guild.queue.textChannel?.send(createEmbed("warn", "I'm just disconnected from the voice channel, the queue will be deleted."))
                        .catch(e => this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", e));
                    return newState.guild.queue = null;
                } catch (e) {
                    this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", e);
                }
            }

            // Handle when the bot is moved to another voice channel
            if (oldState.member?.user.id === this.client.user?.id && oldID === musicVcID && newID !== musicVcID) {
                const vc = newState.channel?.members.filter(m => !m.user.bot);
                if (vc?.size === 0 && newState.guild.queue?.timeout === null) this.doTimeout(vc, newState);

                this.resumeTimeout(vc, newState);
                newState.guild.queue!.voiceChannel = newState.channel;
            }

            const vc = newState.guild.queue?.voiceChannel?.members.filter(m => !m.user.bot);
            // Handle when user leaves voice channel
            if (oldID === musicVcID && newID !== musicVcID && !newState.member?.user.bot && newState.guild.queue?.timeout === null) this.doTimeout(vc, newState);

            // Handle when user joins voice channel or bot gets moved
            if (newID === musicVcID && !newState.member?.user.bot) this.resumeTimeout(vc, newState);
        }
    }

    private doTimeout(vc: Collection<string, GuildMember> | undefined, newState: IVoiceState): any {
        try {
            if (vc?.size === 0) {
                clearTimeout(newState.guild.queue?.timeout as NodeJS.Timeout);
                newState.guild.queue!.timeout = null;
                newState.guild.queue!.playing = false;
                newState.guild.queue?.connection?.dispatcher.pause();
                const timeout = this.client.config.deleteQueueTimeout;
                const duration = formatMS(timeout);
                newState.guild.queue?.textChannel?.send(
                    createEmbed("warn", "The voice channel is empty. To save resources, the queue was paused. " +
                    `If there's no one who joins my voice channel in the next **\`${duration}\`**, the queue will be deleted.`)
                        .setTitle("⏸ Queue paused")
                )
                    .catch(e => this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", e));
                return newState.guild.queue!.timeout = setTimeout(() => {
                    newState.guild.queue?.connection?.dispatcher.once("speaking", () => {
                        newState.guild.queue?.songs.clear();
                        const textChannel = this.client.channels.resolve(newState.guild.queue?.textChannel?.id as Snowflake) as TextChannel;
                        newState.guild.queue?.connection?.dispatcher.end(() => {
                            textChannel.send(
                                createEmbed("error", `**\`${duration}\`** have passed and there is no one who joins my voice channel, the queue was deleted.`)
                                    .setTitle("⏹ Queue deleted")
                            ).catch(e => this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", e));
                        });
                    });
                    newState.guild.queue!.playing = true;
                    newState.guild.queue?.connection?.dispatcher.resume(); // I don't know why but I think I should resume and then end the dispatcher or it won't work
                }, timeout);
            }
        } catch (e) { this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", e); }
    }

    private resumeTimeout(vc: Collection<string, GuildMember> | undefined, newState: IVoiceState): void {
        if (Number(vc?.size) > 0) {
            if (Number(vc?.size) === 1) { clearTimeout(newState.guild.queue?.timeout as NodeJS.Timeout); newState.guild.queue!.timeout = null; }
            if (!newState.guild.queue?.playing && Number(vc?.size) < 2) {
                try {
                    const song = newState.guild.queue?.songs.first();
                    newState.guild.queue?.textChannel?.send(
                        createEmbed("info", `Someone joins the voice channel. Enjoy the queued music!\n🎶  **|**  Now Playing: **[${song!.title}](${song!.url})**`)
                            .setThumbnail(song!.thumbnail)
                            .setTitle("▶ Queue resumed")
                    ).catch(e => this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", e));
                    newState.guild.queue!.playing = true;
                    newState.guild.queue?.connection?.dispatcher.resume();
                } catch (e) {
                    this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", e);
                }
            }
        }
    }
}
