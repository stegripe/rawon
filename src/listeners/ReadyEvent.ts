import { BaseListener } from "../structures/BaseListener";
import { DefineListener } from "../utils/decorators/DefineListener";

@DefineListener("ready")
export class ReadyEvent extends BaseListener {
    public execute(): void {
        this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} ${this.client.user!.tag} is ready to serve ${this.client.guilds.cache.size} guilds!`);
        const updatePresence = async (): Promise<void> => {
            const activityName = this.client.config.status.activity
                .replace(/{guildsCount}/g, (await this.client.getGuildsCount()).toString())
                .replace(/{playingCount}/g, (await this.client.getTotalPlaying()).toString())
                .replace(/{usersCount}/g, (await this.client.getUsersCount()).toString())
                .replace(/{botPrefix}/g, this.client.config.prefix);
            this.client.user?.setPresence({
                activity: { name: activityName, type: this.client.config.status.type }
            }).catch(e => this.client.logger.error("CLIENT_UPDATE_PRESENCE_ERR:", e));
        };
        setInterval(updatePresence, 30 * 1000); void updatePresence();
    }
}
