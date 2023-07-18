import { formatMS } from "../utils/functions/formatMS.js";
import { EnvActivityTypes } from "../typings/index.js";
import { BaseEvent } from "../structures/BaseEvent.js";
import { Event } from "../utils/decorators/Event.js";
import i18n from "../config/index.js";
import { ActivityType, Presence } from "discord.js";

@Event<typeof ReadyEvent>("ready")
export class ReadyEvent extends BaseEvent {
    public async execute(): Promise<void> {
        if (this.client.application?.owner) {
            this.client.config.devs.push(this.client.application.owner.id);
        }

        await this.client.spotify.renew();

        this.client.user?.setPresence({
            activities: [
                {
                    name: i18n.__("events.cmdLoading"),
                    type: ActivityType.Playing
                }
            ],
            status: "dnd"
        })
        await this.client.commands.load();
        this.client.logger.info(`Ready took ${formatMS(Date.now() - this.client.startTimestamp)}`);

        await this.doPresence();
        this.client.logger.info(
            await this.formatString(
                "{username} is ready to serve {userCount} users on {serverCount} guilds in " +
                "{textChannelCount} text channels and {voiceChannelCount} voice channels."
            )
        );
    }

    private async formatString(text: string): Promise<string> {
        let newText = text;

        if (text.includes("{userCount}")) {
            const users = await this.client.utils.getUserCount();

            newText = newText.replace(/{userCount}/g, users.toString());
        }
        if (text.includes("{textChannelCount}")) {
            const textChannels = await this.client.utils.getChannelCount(true);

            newText = newText.replace(/{textChannelCount}/g, textChannels.toString());
        }
        if (text.includes("{voiceChannelCount}")) {
            const voiceChannels = await this.client.utils.getChannelCount(false, true);

            newText = newText.replace(/{voiceChannelCount}/g, voiceChannels.toString());
        }
        if (text.includes("{serverCount}")) {
            const guilds = await this.client.utils.getGuildCount();

            newText = newText.replace(/{serverCount}/g, guilds.toString());
        }
        if (text.includes("{playingCount}")) {
            const playings = await this.client.utils.getPlayingCount();

            newText = newText.replace(/{playingCount}/g, playings.toString());
        }

        return newText
            .replace(/{prefix}/g, this.client.config.mainPrefix)
            .replace(/{username}/g, this.client.user!.username);
    }

    private async setPresence(random: boolean): Promise<Presence> {
        const activityNumber = random
            ? Math.floor(Math.random() * this.client.config.presenceData.activities.length)
            : 0;
        const statusNumber = random ? Math.floor(Math.random() * this.client.config.presenceData.status.length) : 0;
        const activity: {
            name: string;
            type: EnvActivityTypes;
            typeNumber: number;
        } = (
            await Promise.all(
                this.client.config.presenceData.activities.map(async a => {
                    let type = ActivityType.Playing;

                    if (a.type === "Competing") type = ActivityType.Competing;
                    if (a.type === "Watching") type = ActivityType.Watching;
                    if (a.type === "Listening") type = ActivityType.Listening;

                    return Object.assign(a, { name: await this.formatString(a.name), type: a.type, typeNumber: type });
                })
            )
        )[activityNumber];

        return this.client.user!.setPresence({
            activities: (activity as { name: string } | undefined)
                ? [
                    {
                        name: activity.name,
                        type: activity.typeNumber
                    }
                ]
                : [],
            status: this.client.config.presenceData.status[statusNumber]
        });
    }

    private async doPresence(): Promise<Presence | undefined> {
        try {
            return await this.setPresence(false);
        } catch (e) {
            if ((e as Error).message !== "Shards are still being spawned.") {
                this.client.logger.error(String(e));
            }
            return undefined;
        } finally {
            setInterval(() => this.setPresence(true), this.client.config.presenceData.interval);
        }
    }
}
