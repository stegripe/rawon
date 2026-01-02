import process from "node:process";
import { type Guild, type Snowflake, type VoiceBasedChannel } from "discord.js";
import { type Rawon } from "../../structures/Rawon.js";

/**
 * MultiBotManager handles coordination between multiple bot instances
 * to prevent conflicts when multiple bots are invited to the same server.
 *
 * Priority system:
 * - Bot with index 0 (primary bot) has highest priority
 * - When multiple bots are in a server, only the one with highest priority responds
 * - For music/voice features, secondary bots can handle separate voice channels
 */
export class MultiBotManager {
    private static instance: MultiBotManager | null = null;
    private readonly clients: Map<number, Rawon> = new Map();
    private readonly tokens: string[] = [];
    // Track which bot is handling which voice channel (guildId:voiceChannelId -> botId)
    private readonly voiceChannelHandlers: Map<string, Snowflake> = new Map();

    private constructor() {
        // Singleton pattern
    }

    public static getInstance(): MultiBotManager {
        if (!MultiBotManager.instance) {
            MultiBotManager.instance = new MultiBotManager();
        }
        return MultiBotManager.instance;
    }

    /**
     * Mark a bot as handling a specific voice channel in a guild
     */
    public setVoiceChannelHandler(
        guildId: Snowflake,
        voiceChannelId: Snowflake,
        botId: Snowflake,
    ): void {
        const key = `${guildId}:${voiceChannelId}`;
        this.voiceChannelHandlers.set(key, botId);
        // Log all current handlers
        const handlersStr = Array.from(this.voiceChannelHandlers.entries())
            .map(([k, v]) => `${k}=${v}`)
            .join(", ");
        console.log(`[MULTI-BOT-HANDLERS] After set: ${handlersStr}`);
    }

    /**
     * Try to claim a voice channel for a bot. Returns true if successful (no one else has it).
     * This is atomic - checks and sets in one operation to prevent race conditions.
     */
    public tryClaimVoiceChannel(
        guildId: Snowflake,
        voiceChannelId: Snowflake,
        botId: Snowflake,
    ): boolean {
        const key = `${guildId}:${voiceChannelId}`;
        const existingHandler = this.voiceChannelHandlers.get(key);

        // If already claimed by this bot, success
        if (existingHandler === botId) {
            return true;
        }

        // If claimed by another bot, fail
        if (existingHandler) {
            console.log(
                `[MULTI-BOT-CLAIM] Bot ${botId} failed to claim channel ${voiceChannelId} - already claimed by ${existingHandler}`,
            );
            return false;
        }

        // Not claimed, claim it now
        this.voiceChannelHandlers.set(key, botId);
        const handlersStr = Array.from(this.voiceChannelHandlers.entries())
            .map(([k, v]) => `${k}=${v}`)
            .join(", ");
        console.log(
            `[MULTI-BOT-CLAIM] Bot ${botId} claimed channel ${voiceChannelId}. Handlers: ${handlersStr}`,
        );
        return true;
    }

    /**
     * Clear the voice channel handler when bot leaves
     */
    public clearVoiceChannelHandler(guildId: Snowflake, voiceChannelId: Snowflake): void {
        const key = `${guildId}:${voiceChannelId}`;
        this.voiceChannelHandlers.delete(key);
        // Log all current handlers
        const handlersStr = Array.from(this.voiceChannelHandlers.entries())
            .map(([k, v]) => `${k}=${v}`)
            .join(", ");
        console.log(`[MULTI-BOT-HANDLERS] After clear: ${handlersStr || "(empty)"}`);
    }

    /**
     * Get the bot ID that is handling a specific voice channel
     */
    public getVoiceChannelHandlerBotId(
        guildId: Snowflake,
        voiceChannelId: Snowflake,
    ): Snowflake | undefined {
        const key = `${guildId}:${voiceChannelId}`;
        return this.voiceChannelHandlers.get(key);
    }

    /**
     * Check if a specific bot is handling any voice channel in the guild
     */
    public isBotHandlingAnyVoiceChannel(guildId: Snowflake, botId: Snowflake): boolean {
        for (const [key, handlerId] of this.voiceChannelHandlers.entries()) {
            if (key.startsWith(`${guildId}:`) && handlerId === botId) {
                return true;
            }
        }
        return false;
    }

    /**
     * Parse tokens from environment variable
     * Supports comma-separated tokens
     */
    public static parseTokens(tokenString: string | undefined): string[] {
        if (!tokenString || tokenString.trim().length === 0) {
            return [];
        }

        return tokenString
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0);
    }

    /**
     * Check if multi-bot mode is enabled
     */
    public static isMultiBotEnabled(): boolean {
        const tokens = MultiBotManager.parseTokens(process.env.DISCORD_TOKEN);
        return tokens.length > 1;
    }

    /**
     * Get the primary token (first token)
     */
    public static getPrimaryToken(): string | undefined {
        const tokens = MultiBotManager.parseTokens(process.env.DISCORD_TOKEN);
        return tokens[0];
    }

    /**
     * Get all tokens
     */
    public getTokens(): string[] {
        return [...this.tokens];
    }

    /**
     * Set the tokens
     */
    public setTokens(tokens: string[]): void {
        this.tokens.length = 0;
        this.tokens.push(...tokens);
    }

    /**
     * Register a client with its index
     */
    public registerClient(index: number, client: Rawon): void {
        this.clients.set(index, client);
    }

    /**
     * Get a client by index
     */
    public getClient(index: number): Rawon | undefined {
        return this.clients.get(index);
    }

    /**
     * Get the primary client (index 0)
     */
    public getPrimaryClient(): Rawon | undefined {
        return this.clients.get(0);
    }

    /**
     * Get all registered clients
     */
    public getAllClients(): Map<number, Rawon> {
        return new Map(this.clients);
    }

    /**
     * Get the index of a client by its user ID
     */
    public getClientIndex(clientId: Snowflake): number {
        for (const [index, client] of this.clients.entries()) {
            if (client.user?.id === clientId) {
                return index;
            }
        }
        return -1;
    }

    /**
     * Get all bot IDs registered in this multi-bot system
     */
    public getAllBotIds(): Snowflake[] {
        const ids: Snowflake[] = [];
        for (const client of this.clients.values()) {
            if (client.user?.id) {
                ids.push(client.user.id);
            }
        }
        return ids;
    }

    /**
     * Check if a bot ID belongs to this multi-bot system
     */
    public isBotInSystem(botId: Snowflake): boolean {
        return this.getAllBotIds().includes(botId);
    }

    /**
     * Get the client that should respond for a given guild.
     * Returns the highest priority (lowest index) bot that is in the guild.
     */
    public getResponsibleClient(guild: Guild): Rawon | null {
        let responsibleClient: Rawon | null = null;
        let lowestIndex = Number.POSITIVE_INFINITY;

        for (const [index, client] of this.clients.entries()) {
            if (client.guilds.cache.has(guild.id) && index < lowestIndex) {
                responsibleClient = client;
                lowestIndex = index;
            }
        }

        return responsibleClient;
    }

    /**
     * Check if a specific client is the responsible one for a guild
     */
    public isResponsibleClient(client: Rawon, guild: Guild): boolean {
        const responsibleClient = this.getResponsibleClient(guild);
        return responsibleClient?.user?.id === client.user?.id;
    }

    /**
     * Get clients sorted by index (priority order)
     * Clients with lower index have higher priority
     */
    private getClientsSortedByPriority(): [number, Rawon][] {
        return Array.from(this.clients.entries()).sort((a, b) => a[0] - b[0]);
    }

    /**
     * For music/voice features: Get the client that should handle a specific voice channel.
     * If a bot is already in a voice channel, it should continue handling it.
     * Otherwise, assign the highest priority available bot.
     */
    public getVoiceChannelHandler(
        guild: Guild,
        targetVoiceChannel: VoiceBasedChannel,
    ): Rawon | null {
        const sortedClients = this.getClientsSortedByPriority();

        // First, check if any bot is already registered as handling this voice channel
        const registeredHandlerId = this.getVoiceChannelHandlerBotId(
            guild.id,
            targetVoiceChannel.id,
        );
        if (registeredHandlerId) {
            for (const [, client] of sortedClients) {
                if (client.user?.id === registeredHandlerId) {
                    return client;
                }
            }
        }

        // Check if any bot is already physically in the target voice channel
        for (const [, client] of sortedClients) {
            const guildFromClient = client.guilds.cache.get(guild.id);
            if (guildFromClient) {
                const botVoiceChannel = guildFromClient.members.me?.voice.channel;
                if (botVoiceChannel?.id === targetVoiceChannel.id) {
                    return client;
                }
            }
        }

        // No bot is in the target voice channel, find an available one
        // (not in any voice channel AND not registered as handling any other channel)
        for (const [, client] of sortedClients) {
            const guildFromClient = client.guilds.cache.get(guild.id);
            if (guildFromClient) {
                const botVoiceChannel = guildFromClient.members.me?.voice.channel;
                const isHandlingOtherChannel = this.isBotHandlingAnyVoiceChannel(
                    guild.id,
                    client.user?.id ?? "",
                );
                console.log(
                    `[MULTI-BOT-HANDLER] Checking ${client.user?.tag}: botVoiceChannel=${botVoiceChannel?.name ?? "null"}, isHandlingOther=${isHandlingOtherChannel}`,
                );
                // Bot is available (not in any voice channel AND not handling any channel)
                if (!botVoiceChannel && !isHandlingOtherChannel) {
                    console.log(`[MULTI-BOT-HANDLER] Returning ${client.user?.tag} as available`);
                    return client;
                }
            }
        }

        // All bots are busy, return null instead of primary bot
        // This forces the calling code to handle the case where no bot is truly available
        console.log(`[MULTI-BOT-HANDLER] All bots busy, returning null`);
        return null;
    }

    /**
     * Get all bots that are in a specific guild
     */
    public getBotsInGuild(guild: Guild): Rawon[] {
        const bots: Rawon[] = [];
        for (const [, client] of this.getClientsSortedByPriority()) {
            if (client.guilds.cache.has(guild.id)) {
                bots.push(client);
            }
        }
        return bots;
    }

    /**
     * Check if multi-bot mode is active (more than one client registered)
     */
    public isMultiBotActive(): boolean {
        return this.clients.size > 1;
    }

    /**
     * Get the number of registered clients
     */
    public getClientCount(): number {
        return this.clients.size;
    }

    /**
     * Clear all clients (for cleanup)
     */
    public clear(): void {
        this.clients.clear();
    }
}
