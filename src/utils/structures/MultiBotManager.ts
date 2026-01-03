import type { Guild, Snowflake, VoiceChannel } from "discord.js";
import type { Rawon } from "../../structures/Rawon.js";
import { discordIds, discordTokens, isMultiBot } from "../../config/env.js";

export interface BotInstance {
    client: Rawon;
    tokenIndex: number;
    botId: Snowflake;
    isPrimary: boolean;
}

/**
 * Manages multiple bot instances for multi-bot feature.
 * Handles priority, guild detection, and voice channel assignments.
 */
export class MultiBotManager {
    private readonly bots: Map<number, BotInstance> = new Map();
    private primaryBot: BotInstance | null = null;
    private static instance: MultiBotManager | null = null;

    public constructor() {
        if (!isMultiBot) {
            return; // Multi-bot disabled
        }
    }

    /**
     * Get or create singleton instance
     */
    public static getInstance(): MultiBotManager {
        if (!MultiBotManager.instance) {
            MultiBotManager.instance = new MultiBotManager();
        }
        return MultiBotManager.instance;
    }

    /**
     * Register a bot instance
     */
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

    /**
     * Get all registered bots
     */
    public getBots(): BotInstance[] {
        return Array.from(this.bots.values());
    }

    /**
     * Get primary bot (first token)
     */
    public getPrimaryBot(): Rawon | null {
        return this.primaryBot?.client ?? null;
    }

    /**
     * Get bot instance by token index
     */
    public getBotByIndex(index: number): BotInstance | null {
        return this.bots.get(index) ?? null;
    }

    /**
     * Get bot instance by bot ID
     */
    public getBotById(botId: Snowflake): BotInstance | null {
        for (const bot of this.bots.values()) {
            if (bot.botId === botId) {
                return bot;
            }
        }
        return null;
    }

    /**
     * Get bot instance by client
     */
    public getBotByClient(client: Rawon): BotInstance | null {
        for (const bot of this.bots.values()) {
            if (bot.client === client) {
                return bot;
            }
        }
        return null;
    }

    /**
     * Determine which bot should handle a command/interaction in a guild.
     * Priority: Primary bot > First available bot in guild
     */
    public getResponsibleBot(guild: Guild): Rawon | null {
        if (!isMultiBot) {
            return guild.client as Rawon; // Single bot mode
        }

        // Check if primary bot is in this guild
        const primary = this.primaryBot;
        if (primary) {
            // Check if primary bot's client has this guild
            const primaryGuild = primary.client.guilds.cache.get(guild.id);
            if (primaryGuild && primaryGuild.members.cache.has(primary.botId)) {
                return primary.client;
            }
        }

        // Find first available bot in guild (in order of token index)
        for (let i = 0; i < discordTokens.length; i++) {
            const bot = this.bots.get(i);
            if (bot) {
                const botGuild = bot.client.guilds.cache.get(guild.id);
                if (botGuild && botGuild.members.cache.has(bot.botId)) {
                    return bot.client;
                }
            }
        }

        // Fallback to any client if guild check fails (shouldn't happen)
        return guild.client as Rawon;
    }

    /**
     * Get all bots that are present in a guild, sorted by priority
     */
    public getBotsInGuild(guild: Guild): BotInstance[] {
        if (!isMultiBot) {
            const botInstance = this.getBotByClient(guild.client as Rawon);
            return botInstance ? [botInstance] : [];
        }

        const botsInGuild: BotInstance[] = [];
        for (let i = 0; i < discordTokens.length; i++) {
            const bot = this.bots.get(i);
            if (bot) {
                // Check if bot's client has this guild
                const botGuild = bot.client.guilds.cache.get(guild.id);
                if (botGuild) {
                    // Check if bot is a member (try to fetch if not cached)
                    const member = botGuild.members.cache.get(bot.botId);
                    if (member) {
                        botsInGuild.push(bot);
                    } else {
                        // Member might not be cached, try fetching
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
                        // Still add it if guild exists (member might just not be cached)
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

    /**
     * Get bot responsible for handling a voice channel.
     * Priority: Primary bot first, then distribute across secondary bots.
     * Each voice channel in a guild should be handled by a different bot when possible.
     * 
     * IMPORTANT: This method must return the SAME result for all bot instances
     * when called with the same guild ID and voice channel ID.
     */
    public getBotForVoiceChannel(guild: Guild, voiceChannelId: Snowflake): Rawon | null {
        if (!isMultiBot) {
            return guild.client as Rawon;
        }

        // Use guild ID to ensure consistency across all bot instances
        const guildId = guild.id;
        
        // Get all bots that have this guild
        const botsInGuild: BotInstance[] = [];
        for (let i = 0; i < discordTokens.length; i++) {
            const bot = this.bots.get(i);
            if (bot) {
                const botGuild = bot.client.guilds.cache.get(guildId);
                if (botGuild) {
                    // Member might not be cached, but if guild exists, bot is in it
                    botsInGuild.push(bot);
                }
            }
        }
        
        // Sort by priority (token index)
        botsInGuild.sort((a, b) => a.tokenIndex - b.tokenIndex);
        
        if (botsInGuild.length === 0) {
            return null;
        }

        // Check which bots are already handling voice channels in this guild
        // Also check if bot has an active queue for that voice channel
        // Use guildId instead of guild object for consistency
        const botsInVoiceChannels = new Map<Rawon, Snowflake | null>();
        const botsWithQueues = new Map<Rawon, Snowflake | null>();
        
        for (const bot of botsInGuild) {
            const botGuild = bot.client.guilds.cache.get(guildId);
            if (!botGuild) {
                continue; // Bot doesn't have this guild
            }
            
            const member = botGuild.members.cache.get(bot.botId);
            const currentVoiceChannel = member?.voice.channelId ?? null;
            botsInVoiceChannels.set(bot.client, currentVoiceChannel);
            
            // Check if bot has an active queue for a voice channel
            const queue = botGuild.queue;
            const queueVoiceChannel = queue?.connection?.joinConfig.channelId ?? null;
            const hasActiveQueue = queue !== undefined && queueVoiceChannel !== null;
            botsWithQueues.set(bot.client, queueVoiceChannel);
            
            // Debug log for each bot's state
            bot.client.logger.debug(
                `[MultiBot] Bot ${bot.client.user?.tag} (index ${bot.tokenIndex}, primary: ${bot.isPrimary}): ` +
                `voiceChannel=${currentVoiceChannel ?? "none"}, queueChannel=${queueVoiceChannel ?? "none"}, ` +
                `hasQueue=${queue !== undefined}, hasActiveQueue=${hasActiveQueue}, playing=${queue?.playing ?? false}`,
            );
        }

        // First, check if any bot is already handling this exact voice channel
        // Priority: Bot with active queue > Bot just in voice channel
        let botWithQueue: BotInstance | null = null;
        let botInVoice: BotInstance | null = null;
        
        for (const bot of botsInGuild) {
            const currentVoiceChannel = botsInVoiceChannels.get(bot.client);
            const queueVoiceChannel = botsWithQueues.get(bot.client);
            
            // Check if bot has active queue for this channel (highest priority)
            if (queueVoiceChannel === voiceChannelId) {
                bot.client.logger.info(
                    `[MultiBot] Bot ${bot.client.user?.tag} has active queue for voice channel ${voiceChannelId}`,
                );
                botWithQueue = bot;
                break; // Use the first bot with queue (should be the only one)
            }
            
            // Check if bot is in this voice channel (lower priority, but still valid)
            if (currentVoiceChannel === voiceChannelId && !botInVoice) {
                botInVoice = bot;
            }
        }
        
        // Prefer bot with queue, otherwise use bot in voice
        if (botWithQueue) {
            return botWithQueue.client;
        }
        if (botInVoice) {
            botInVoice.client.logger.info(
                `[MultiBot] Bot ${botInVoice.client.user?.tag} is in voice channel ${voiceChannelId}`,
            );
            return botInVoice.client;
        }
        
        // Log summary for debugging
        const primaryBot = botsInGuild.find((b) => b.isPrimary);
        if (primaryBot) {
            const primaryVoiceChannel = botsInVoiceChannels.get(primaryBot.client);
            const primaryQueueChannel = botsWithQueues.get(primaryBot.client);
            primaryBot.client.logger.debug(
                `[MultiBot] Primary bot state check: voiceChannel=${primaryVoiceChannel ?? "none"}, queueChannel=${primaryQueueChannel ?? "none"}, ` +
                `isFree=${!primaryVoiceChannel && !primaryQueueChannel}`,
            );
        }

        // Find all bots that are completely free (not in any voice channel and no active queue)
        const freeBots = botsInGuild.filter((bot) => {
            const currentVoiceChannel = botsInVoiceChannels.get(bot.client);
            const queueVoiceChannel = botsWithQueues.get(bot.client);
            return !currentVoiceChannel && !queueVoiceChannel;
        }).sort((a, b) => {
            // CRITICAL: Primary bot ALWAYS first if free
            // Primary bot has highest priority - must be used first when available
            if (a.isPrimary && !b.isPrimary) return -1;
            if (!a.isPrimary && b.isPrimary) return 1;
            return a.tokenIndex - b.tokenIndex;
        });

        // If we have free bots, ALWAYS use primary bot if it's free
        if (freeBots.length > 0) {
            // Primary bot should be first in sorted array, but double-check
            const primaryFreeBot = freeBots.find((bot) => bot.isPrimary);
            const selectedBot = primaryFreeBot ?? freeBots[0];
            
            selectedBot.client.logger.info(
                `[MultiBot] Selected ${selectedBot.isPrimary ? "PRIMARY" : "secondary"} bot ${selectedBot.client.user?.tag} (index ${selectedBot.tokenIndex}) for voice channel ${voiceChannelId}`,
            );
            return selectedBot.client;
        }

        // CRITICAL: If all bots are busy, DO NOT move/interrupt any bot that's already playing
        // Never interrupt a bot's playback - just return null and let the request fail
        // This prevents bots from being moved while they're playing music
        primaryBot?.client.logger.warn(
            `[MultiBot] All bots are busy playing - cannot handle voice channel ${voiceChannelId} without interrupting active playback. Request ignored.`,
        );
        return null;
    }

    /**
     * Check if a bot should respond to a command based on priority
     */
    public shouldRespond(client: Rawon, guild: Guild): boolean {
        if (!isMultiBot) {
            return true; // Single bot always responds
        }

        // Check if this client is registered
        const thisBot = this.getBotByClient(client);
        if (!thisBot) {
            // If bot not registered yet, allow it to respond (shouldn't happen after ready)
            return true;
        }

        // Check if this client has the guild
        const clientGuild = client.guilds.cache.get(guild.id);
        if (!clientGuild || !clientGuild.members.cache.has(thisBot.botId)) {
            // This bot is not in this guild, don't respond
            return false;
        }

        const responsibleBot = this.getResponsibleBot(guild);
        if (!responsibleBot) {
            // If no responsible bot found, allow this client to respond (fallback)
            return true;
        }

        // Only the responsible bot should respond
        return responsibleBot === client;
    }

    /**
     * Check if a bot should respond to a music command based on voice channel.
     * For music commands that require same voice channel, only the bot in that channel should respond.
     */
    public shouldRespondToMusicCommand(
        client: Rawon,
        guild: Guild,
        userVoiceChannelId: Snowflake | null,
    ): boolean {
        if (!isMultiBot) {
            return true; // Single bot mode, always respond
        }

        if (!userVoiceChannelId) {
            // User not in voice channel, use normal priority check
            client.logger.debug(
                `[MultiBot] ${client.user?.tag} user not in voice channel, using normal priority check`,
            );
            return this.shouldRespond(client, guild);
        }

        // CRITICAL: Use THIS bot's guild object, not the parameter guild
        // The guild parameter might be from a different bot instance
        const thisBotGuild = client.guilds.cache.get(guild.id);
        if (!thisBotGuild) {
            // This bot doesn't have this guild, definitely don't respond
            client.logger.warn(
                `[MultiBot] ${client.user?.tag} does not have guild ${guild.id}, blocking music command`,
            );
            return false;
        }

        // CRITICAL: First check if THIS bot is actually in the user's voice channel
        // Use thisBotGuild.members.me for most accurate voice state (always available)
        const thisBotVoiceChannel = thisBotGuild.members.me?.voice.channelId ?? null;
        const thisBotQueueChannel = thisBotGuild.queue?.connection?.joinConfig.channelId ?? null;
        
        // Also check voiceStates cache as fallback
        const voiceState = thisBotGuild.voiceStates.cache.get(client.user?.id ?? "");
        const voiceStateChannel = voiceState?.channelId ?? null;
        
        // Use the most reliable source: members.me first, then voiceStates, then queue
        const actualBotVoiceChannel = thisBotVoiceChannel ?? voiceStateChannel ?? thisBotQueueChannel;
        
        // Check both voice channel and queue channel
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
        
        // If this bot is NOT in the user's voice channel, immediately return false
        if (!thisBotIsInChannel) {
            // Still need to find which bot IS in the channel for logging
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
            // CRITICAL: Return false immediately - this bot should NOT process the command
            return false;
        }

        // Get bot that's handling this voice channel (for validation)
        // Use thisBotGuild instead of guild parameter to ensure we're checking the right bot instance
        const responsibleBot = this.getBotForVoiceChannel(thisBotGuild, userVoiceChannelId);
        if (!responsibleBot) {
            // No bot available for this channel, but this bot is in the channel, allow it
            client.logger.debug(
                `[MultiBot] ${client.user?.tag} no responsible bot found but this bot is in channel, allowing response`,
            );
            return true;
        }

        // Verify that the responsible bot is indeed this bot
        const shouldRespond = responsibleBot.user?.id === client.user?.id;
        if (!shouldRespond) {
            client.logger.warn(
                `[MultiBot] ${client.user?.tag} CONFLICT: This bot thinks it's in channel ${userVoiceChannelId} ` +
                `but getBotForVoiceChannel says ${responsibleBot.user?.tag} is responsible!`,
            );
            return false; // Safety check failed, don't respond
        }

        client.logger.info(
            `[MultiBot] ${client.user?.tag} WILL respond to music command - confirmed responsible for voice channel ${userVoiceChannelId}`,
        );
        return true;
    }

    /**
     * Check if a bot should respond to a voice channel request
     */
    public shouldRespondToVoice(
        client: Rawon,
        guild: Guild,
        voiceChannelId: Snowflake,
    ): boolean {
        if (!isMultiBot) {
            return true;
        }

        // Check if this client is registered
        const thisBot = this.getBotByClient(client);
        if (!thisBot) {
            // If bot not registered yet, allow it to respond (shouldn't happen after ready)
            client.logger.debug(
                `[MultiBot] ${client.user?.tag} not registered in MultiBotManager, allowing response`,
            );
            return true;
        }

        // Check if this client has the guild - use the client's own guild object
        const clientGuild = client.guilds.cache.get(guild.id);
        if (!clientGuild) {
            // This bot's client doesn't have this guild, don't respond
            client.logger.debug(
                `[MultiBot] ${client.user?.tag} does not have guild ${guild.id} in cache, skipping response`,
            );
            return false;
        }

        // Check if bot is a member of the guild
        const member = clientGuild.members.cache.get(thisBot.botId);
        if (!member) {
            // Try to fetch, but for now skip
            client.logger.debug(
                `[MultiBot] ${client.user?.tag} is not a cached member of guild ${guild.id}, skipping response`,
            );
            return false;
        }

        // Use client's own guild object for consistency
        const responsibleBot = this.getBotForVoiceChannel(clientGuild, voiceChannelId);
        
        if (!responsibleBot) {
            // If no responsible bot found, allow this client to respond (fallback)
            client.logger.debug(
                `[MultiBot] No responsible bot found for voice channel ${voiceChannelId}, allowing ${client.user?.tag}`,
            );
            return false;
        }


        // Strict comparison - must be the exact same client instance
        const shouldRespond = responsibleBot === client;
        if (!shouldRespond) {
            client.logger.debug(
                `[MultiBot] ${client.user?.tag} should NOT respond to voice channel ${voiceChannelId} (responsible: ${responsibleBot.user?.tag})`,
            );
        } else {
            client.logger.info(
                `[MultiBot] ${client.user?.tag} WILL respond to voice channel ${voiceChannelId}`,
            );
        }

        return shouldRespond;
    }

    /**
     * Get bot ID for a given token index
     */
    public static getBotIdForTokenIndex(index: number): Snowflake | null {
        if (index >= 0 && index < discordIds.length) {
            return discordIds[index];
        }
        return null;
    }

    /**
     * Check if multi-bot mode is enabled
     */
    public static isEnabled(): boolean {
        return isMultiBot;
    }
}

