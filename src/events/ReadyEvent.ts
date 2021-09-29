import { DefineEvent } from "../utils/decorators/DefineEvent";
import { BaseEvent } from "../structures/BaseEvent";
import { Presence } from "discord.js";

@DefineEvent("ready")
export class ReadyEvent extends BaseEvent {
    public async execute(): Promise<void> {
        if (this.client.application?.owner) this.client.config.owners.push(this.client.application.owner.id);

        await this.doPresence();
        this.client.logger.info(this.formatString("{username} is ready to serve {users.size} users on {guilds.size} guilds in " +
        "{textChannels.size} text channels and {voiceChannels.size} voice channels!"));
    }

    private formatString(text: string): string {
        return text
            .replace(/{users.size}/g, (this.client.users.cache.size - 1).toString())
            .replace(/{textChannels.size}/g, this.client.channels.cache.filter(ch => ch.type === "GUILD_TEXT").size.toString())
            .replace(/{guilds.size}/g, this.client.guilds.cache.size.toString())
            .replace(/{username}/g, this.client.user?.username as string)
            .replace(/{voiceChannels.size}/g, this.client.channels.cache.filter(ch => ch.type === "GUILD_VOICE").size.toString());
    }

    private setPresence(random: boolean): Presence {
        const activityNumber = random ? Math.floor(Math.random() * this.client.config.presenceData.activities.length) : 0;
        const statusNumber = random ? Math.floor(Math.random() * this.client.config.presenceData.status.length) : 0;
        const activity = this.client.config.presenceData.activities.map(a => Object.assign(a, { name: this.formatString(a.name) }))[activityNumber];

        return this.client.user!.setPresence({
            activities: [activity],
            status: this.client.config.presenceData.status[statusNumber]
        });
    }

    private async doPresence(): Promise<Presence | undefined> {
        try {
            return this.setPresence(false);
        } catch (e) {
            if ((e as Error).message !== "Shards are still being spawned.") this.client.logger.error(String(e));
            return undefined;
        } finally {
            setInterval(() => this.setPresence(true), this.client.config.presenceData.interval);
        }
    }
}
