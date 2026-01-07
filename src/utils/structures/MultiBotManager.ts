import { type Guild, type Snowflake } from "discord.js";
import { discordTokens, isMultiBot } from "../../config/env.js";
import { type Rawon } from "../../structures/Rawon.js";

export interface BotInstance {
    client: Rawon;
    tokenIndex: number;
    botId: Snowflake;
    isPrimary: boolean;
}

export class MultiBotManager {
    private readonly bots: Map<number, BotInstance> = new Map();
    private primaryBot: BotInstance | null = null;
    private static instance: MultiBotManager | null = null;

    public constructor() {
        if (!isMultiBot) {
            return;
        }
    }

    public static getInstance(): MultiBotManager {
        if (!MultiBotManager.instance) {
            MultiBotManager.instance = new MultiBotManager();
        }
        return MultiBotManager.instance;
    }

    public registerBot(client: Rawon, tokenIndex: number, botId: Snowflake): void {
        const isPrimary = tokenIndex === 0;
        const instance: BotInstance = {
            client,
            tokenIndex,
            botId,
            isPrimary,
        };

        this.bots.set(tokenIndex, instance);
        if (isPrimary) {
            this.primaryBot = instance;
        }
    }

    public getBots(): BotInstance[] {
        return Array.from(this.bots.values());
    }

    public getPrimaryBot(): Rawon | null {
        return this.primaryBot?.client ?? null;
    }

    public getBotByIndex(index: number): BotInstance | null {
        return this.bots.get(index) ?? null;
    }

    public getBotById(botId: Snowflake): BotInstance | null {
        for (const bot of this.bots.values()) {
            if (bot.botId === botId) {
                return bot;
            }
        }
        return null;
    }

    public getBotByClient(client: Rawon): BotInstance | null {
        for (const bot of this.bots.values()) {
            if (bot.client === client) {
                return bot;
            }
        }
        return null;
    }

    public getResponsibleBot(guild: Guild): Rawon | null {
        if (!isMultiBot) {
            return guild.client as Rawon;
        }

        const primary = this.primaryBot;
        if (primary) {
            const primaryGuild = primary.client.guilds.cache.get(guild.id);
            if (primaryGuild?.members.cache.has(primary.botId)) {
                return primary.client;
            }
        }

        for (let i = 0; i < discordTokens.length; i++) {
            const bot = this.bots.get(i);
            if (bot) {
                const botGuild = bot.client.guilds.cache.get(guild.id);
                if (botGuild?.members.cache.has(bot.botId)) {
                    return bot.client;
                }
            }
        }

        return guild.client as Rawon;
    }

    public getBotsInGuild(guild: Guild): BotInstance[] {
        if (!isMultiBot) {
            const botInstance = this.getBotByClient(guild.client as Rawon);
            return botInstance ? [botInstance] : [];
        }

        const botsInGuild: BotInstance[] = [];
        for (let i = 0; i < discordTokens.length; i++) {
            const bot = this.bots.get(i);
            if (bot) {
                const botGuild = bot.client.guilds.cache.get(guild.id);
                if (botGuild) {
                    const member = botGuild.members.cache.get(bot.botId);
                    if (member) {
                        botsInGuild.push(bot);
                    } else {
                        botGuild.members
                            .fetch(bot.botId)
                            .then(() => {
                                bot.client.logger.debug(
                                    `[MultiBot] Fetched member ${bot.botId} for guild ${guild.id}`,
                                );
                            })
                            .catch(() => {
                                bot.client.logger.warn(
                                    `[MultiBot] Bot ${bot.botId} is not a member of guild ${guild.id}`,
                                );
                            });
                        botsInGuild.push(bot);
                    }
                } else {
                    bot.client.logger.debug(
                        `[MultiBot] Bot ${bot.client.user?.tag} does not have guild ${guild.id} in cache`,
                    );
                }
            }
        }
        return botsInGuild.sort((a, b) => a.tokenIndex - b.tokenIndex);
    }

    public getBotForVoiceChannel(guild: Guild, voiceChannelId: Snowflake): Rawon | null {
        if (!isMultiBot) {
            return guild.client as Rawon;
        }

        const guildId = guild.id;

        const botsInGuild: BotInstance[] = [];
        for (let i = 0; i < discordTokens.length; i++) {
            const bot = this.bots.get(i);
            if (bot) {
                const botGuild = bot.client.guilds.cache.get(guildId);
                if (botGuild) {
                    botsInGuild.push(bot);
                }
            }
        }

        botsInGuild.sort((a, b) => a.tokenIndex - b.tokenIndex);

        if (botsInGuild.length === 0) {
            return null;
        }

        const botsInVoiceChannels = new Map<Rawon, Snowflake | null>();
        const botsWithQueues = new Map<Rawon, Snowflake | null>();

        for (const bot of botsInGuild) {
            const botGuild = bot.client.guilds.cache.get(guildId);
            if (!botGuild) {
                continue;
            }

            const member = botGuild.members.cache.get(bot.botId);
            const currentVoiceChannel = member?.voice.channelId ?? null;
            botsInVoiceChannels.set(bot.client, currentVoiceChannel);

            const queue = botGuild.queue;
            const queueVoiceChannel = queue?.connection?.joinConfig.channelId ?? null;
            const hasActiveQueue = queue !== undefined && queueVoiceChannel !== null;
            botsWithQueues.set(bot.client, queueVoiceChannel);

            bot.client.logger.debug(
                `[MultiBot] Bot ${bot.client.user?.tag} (index ${bot.tokenIndex}, primary: ${bot.isPrimary}): ` +
                    `voiceChannel=${currentVoiceChannel ?? "none"}, queueChannel=${queueVoiceChannel ?? "none"}, ` +
                    `hasQueue=${queue !== undefined}, hasActiveQueue=${hasActiveQueue}, playing=${queue?.playing ?? false}`,
            );
        }

        let botWithQueue: BotInstance | null = null;
        let botInVoice: BotInstance | null = null;

        for (const bot of botsInGuild) {
            const currentVoiceChannel = botsInVoiceChannels.get(bot.client);
            const queueVoiceChannel = botsWithQueues.get(bot.client);

            if (queueVoiceChannel === voiceChannelId) {
                bot.client.logger.info(
                    `[MultiBot] Bot ${bot.client.user?.tag} has active queue for voice channel ${voiceChannelId}`,
                );
                botWithQueue = bot;
                break;
            }

            if (currentVoiceChannel === voiceChannelId && !botInVoice) {
                botInVoice = bot;
            }
        }

        if (botWithQueue) {
            return botWithQueue.client;
        }
        if (botInVoice) {
            botInVoice.client.logger.info(
                `[MultiBot] Bot ${botInVoice.client.user?.tag} is in voice channel ${voiceChannelId}`,
            );
            return botInVoice.client;
        }

        const primaryBot = botsInGuild.find((b) => b.isPrimary);
        if (primaryBot) {
            const primaryVoiceChannel = botsInVoiceChannels.get(primaryBot.client);
            const primaryQueueChannel = botsWithQueues.get(primaryBot.client);
            primaryBot.client.logger.debug(
                `[MultiBot] Primary bot state check: voiceChannel=${primaryVoiceChannel ?? "none"}, queueChannel=${primaryQueueChannel ?? "none"}, ` +
                    `isFree=${!primaryVoiceChannel && !primaryQueueChannel}`,
            );
        }
        const freeBots = botsInGuild
            .filter((bot) => {
                const currentVoiceChannel = botsInVoiceChannels.get(bot.client);
                const queueVoiceChannel = botsWithQueues.get(bot.client);
                return !currentVoiceChannel && !queueVoiceChannel;
            })
            .sort((a, b) => {
                if (a.isPrimary && !b.isPrimary) {
                    return -1;
                }
                if (!a.isPrimary && b.isPrimary) {
                    return 1;
                }
                return a.tokenIndex - b.tokenIndex;
            });
        if (freeBots.length > 0) {
            const primaryFreeBot = freeBots.find((bot) => bot.isPrimary);
            const selectedBot = primaryFreeBot ?? freeBots[0];

            selectedBot.client.logger.info(
                `[MultiBot] Selected ${selectedBot.isPrimary ? "PRIMARY" : "secondary"} bot ${selectedBot.client.user?.tag} (index ${selectedBot.tokenIndex}) for voice channel ${voiceChannelId}`,
            );
            return selectedBot.client;
        }
        primaryBot?.client.logger.warn(
            `[MultiBot] All bots are busy playing - cannot handle voice channel ${voiceChannelId} without interrupting active playback. Request ignored.`,
        );
        return null;
    }

    public shouldRespond(client: Rawon, guild: Guild): boolean {
        if (!isMultiBot) {
            return true;
        }
        const thisBot = this.getBotByClient(client);
        if (!thisBot) {
            return true;
        }
        const clientGuild = client.guilds.cache.get(guild.id);
        if (!clientGuild || !clientGuild.members.cache.has(thisBot.botId)) {
            return false;
        }

        const responsibleBot = this.getResponsibleBot(guild);
        if (!responsibleBot) {
            return true;
        }
        return responsibleBot === client;
    }

    public shouldRespondToMusicCommand(
        client: Rawon,
        guild: Guild,
        userVoiceChannelId: Snowflake | null,
    ): boolean {
        if (!isMultiBot) {
            return true;
        }

        if (!userVoiceChannelId) {
            client.logger.debug(
                `[MultiBot] ${client.user?.tag} user not in voice channel, using normal priority check`,
            );
            return this.shouldRespond(client, guild);
        }

        const thisBotGuild = client.guilds.cache.get(guild.id);
        if (!thisBotGuild) {
            client.logger.warn(
                `[MultiBot] ${client.user?.tag} does not have guild ${guild.id}, blocking music command`,
            );
            return false;
        }

        const thisBotVoiceChannel = thisBotGuild.members.me?.voice.channelId ?? null;
        const thisBotQueueChannel = thisBotGuild.queue?.connection?.joinConfig.channelId ?? null;

        const voiceState = thisBotGuild.voiceStates.cache.get(client.user?.id ?? "");
        const voiceStateChannel = voiceState?.channelId ?? null;

        const actualBotVoiceChannel =
            thisBotVoiceChannel ?? voiceStateChannel ?? thisBotQueueChannel;

        const thisBotIsInVoiceChannel = actualBotVoiceChannel === userVoiceChannelId;
        const thisBotHasQueueForChannel = thisBotQueueChannel === userVoiceChannelId;
        const thisBotIsInChannel = thisBotIsInVoiceChannel || thisBotHasQueueForChannel;

        client.logger.info(
            `[MultiBot] ${client.user?.tag} checking music command response: ` +
                `userVoiceChannel=${userVoiceChannelId ?? "none"}, ` +
                `thisBotVoiceChannel(members.me)=${thisBotVoiceChannel ?? "none"}, ` +
                `voiceStateChannel=${voiceStateChannel ?? "none"}, ` +
                `actualBotVoiceChannel=${actualBotVoiceChannel ?? "none"}, ` +
                `thisBotQueueChannel=${thisBotQueueChannel ?? "none"}, ` +
                `thisBotIsInVoiceChannel=${thisBotIsInVoiceChannel}, ` +
                `thisBotHasQueueForChannel=${thisBotHasQueueForChannel}, ` +
                `thisBotIsInChannel=${thisBotIsInChannel}`,
        );

        if (!thisBotIsInChannel) {
            const responsibleBot = this.getBotForVoiceChannel(thisBotGuild, userVoiceChannelId);
            if (responsibleBot) {
                client.logger.warn(
                    `[MultiBot] ${client.user?.tag} ❌ BLOCKED music command - NOT in user's voice channel! ` +
                        `User in: ${userVoiceChannelId}, responsible bot: ${responsibleBot.user?.tag}. ` +
                        `This bot should NOT respond to this command!`,
                );
            } else {
                client.logger.warn(
                    `[MultiBot] ${client.user?.tag} ❌ BLOCKED music command - NOT in user's voice channel and no responsible bot found! ` +
                        `User in: ${userVoiceChannelId}. This bot should NOT respond!`,
                );
            }

            return false;
        }

        const responsibleBot = this.getBotForVoiceChannel(thisBotGuild, userVoiceChannelId);
        if (!responsibleBot) {
            client.logger.debug(
                `[MultiBot] ${client.user?.tag} no responsible bot found but this bot is in channel, allowing response`,
            );
            return true;
        }
        const shouldRespond = responsibleBot.user?.id === client.user?.id;
        if (!shouldRespond) {
            client.logger.warn(
                `[MultiBot] ${client.user?.tag} CONFLICT: This bot thinks it's in channel ${userVoiceChannelId} ` +
                    `but getBotForVoiceChannel says ${responsibleBot.user?.tag} is responsible!`,
            );
            return false;
        }

        client.logger.info(
            `[MultiBot] ${client.user?.tag} WILL respond to music command - confirmed responsible for voice channel ${userVoiceChannelId}`,
        );
        return true;
    }

    public shouldRespondToVoice(client: Rawon, guild: Guild, voiceChannelId: Snowflake): boolean {
        if (!isMultiBot) {
            return true;
        }
        const thisBot = this.getBotByClient(client);
        if (!thisBot) {
            client.logger.debug(
                `[MultiBot] ${client.user?.tag} not registered in MultiBotManager, allowing response`,
            );
            return true;
        }
        const clientGuild = client.guilds.cache.get(guild.id);
        if (!clientGuild) {
            client.logger.debug(
                `[MultiBot] ${client.user?.tag} does not have guild ${guild.id} in cache, skipping response`,
            );
            return false;
        }
        const member = clientGuild.members.cache.get(thisBot.botId);
        if (!member) {
            client.logger.debug(
                `[MultiBot] ${client.user?.tag} is not a cached member of guild ${guild.id}, skipping response`,
            );
            return false;
        }
        const responsibleBot = this.getBotForVoiceChannel(clientGuild, voiceChannelId);

        if (!responsibleBot) {
            client.logger.debug(
                `[MultiBot] No responsible bot found for voice channel ${voiceChannelId}, allowing ${client.user?.tag}`,
            );
            return false;
        }

        const shouldRespond = responsibleBot === client;
        if (shouldRespond) {
            client.logger.info(
                `[MultiBot] ${client.user?.tag} WILL respond to voice channel ${voiceChannelId}`,
            );
        } else {
            client.logger.debug(
                `[MultiBot] ${client.user?.tag} should NOT respond to voice channel ${voiceChannelId} (responsible: ${responsibleBot.user?.tag})`,
            );
        }

        return shouldRespond;
    }

    public static isEnabled(): boolean {
        return isMultiBot;
    }
}
