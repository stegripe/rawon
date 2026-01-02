import { type Client, type Guild } from "discord.js";

/**
 * Manages multiple Discord clients for multi-bot support.
 * Only one client (the "primary" for each guild) handles events.
 * Other clients are available for voice connections only.
 */
export class MultiClientManager {
    private static instance: MultiClientManager | null = null;
    private clients: Client[] = [];
    private clientPriorities: Map<string, number> = new Map(); // clientId -> priority (0 = highest)
    // Track voice channel connections manually: guildId -> Map<clientId, voiceChannelId>
    private voiceConnections: Map<string, Map<string, string>> = new Map();

    private constructor() {}

    public static getInstance(): MultiClientManager {
        if (!MultiClientManager.instance) {
            MultiClientManager.instance = new MultiClientManager();
        }
        return MultiClientManager.instance;
    }

    /**
     * Register a client with its priority (lower = higher priority)
     */
    public registerClient(client: Client, priority: number): void {
        this.clients[priority] = client;
        if (client.user) {
            this.clientPriorities.set(client.user.id, priority);
            console.log(`[MultiClient] Registered client ${client.user.tag} with priority ${priority}`);
        }

        // Update priority when client becomes ready
        client.once("ready", () => {
            if (client.user) {
                this.clientPriorities.set(client.user.id, priority);
                console.log(`[MultiClient] Client ${client.user.tag} ready, confirmed priority ${priority}`);
            }
        });
    }

    /**
     * Get all registered clients
     */
    public getClients(): Client[] {
        return this.clients.filter(Boolean);
    }

    /**
     * Get client by priority index
     */
    public getClient(priority: number): Client | undefined {
        return this.clients[priority];
    }

    /**
     * Get the primary client (priority 0)
     */
    public getPrimaryClient(): Client | undefined {
        return this.clients[0];
    }

    /**
     * Check if a client is the primary responder for a guild.
     * The primary responder is the client with the lowest priority that is in the guild.
     */
    public isPrimaryForGuildObj(client: Client, guild: Guild): boolean {
        if (!client.user) {
            return false;
        }

        const clientPriority = this.clientPriorities.get(client.user.id);
        if (clientPriority === undefined) {
            return false;
        }

        // Find the lowest priority client that is in this guild
        const allClients = this.getClients();
        for (const c of allClients) {
            if (c.user && c.guilds.cache.has(guild.id)) {
                // This is the primary for this guild
                return c.user.id === client.user.id;
            }
        }

        return false;
    }

    /**
     * Track a bot joining a voice channel.
     * Call this when a bot successfully joins a voice channel.
     */
    public trackVoiceJoin(clientId: string, guildId: string, voiceChannelId: string): void {
        if (!this.voiceConnections.has(guildId)) {
            this.voiceConnections.set(guildId, new Map());
        }
        this.voiceConnections.get(guildId)!.set(clientId, voiceChannelId);
        console.log(`[MultiClient] Tracked voice join: ${clientId} -> ${voiceChannelId} in guild ${guildId}`);
    }

    /**
     * Track a bot leaving a voice channel.
     * Call this when a bot leaves a voice channel.
     */
    public trackVoiceLeave(clientId: string, guildId: string): void {
        const guildConnections = this.voiceConnections.get(guildId);
        if (guildConnections) {
            guildConnections.delete(clientId);
            console.log(`[MultiClient] Tracked voice leave: ${clientId} from guild ${guildId}`);
        }
    }

    /**
     * Get the voice channel ID a bot is connected to in a guild.
     * Uses manual tracking as primary source since guild.queue is per-client.
     */
    private getBotVoiceChannelIdForClient(clientId: string, guildId: string, guild: Guild): string | undefined {
        // Primary method: Check manual tracking (most reliable across clients)
        const guildConnections = this.voiceConnections.get(guildId);
        if (guildConnections?.has(clientId)) {
            return guildConnections.get(clientId);
        }
        
        // Fallback: Check the queue connection (only works for same client's guild)
        const queueVoiceChannelId = guild.queue?.connection?.joinConfig.channelId;
        if (queueVoiceChannelId) {
            return queueVoiceChannelId;
        }
        
        // Fallback: Check member voice state
        return guild.members.me?.voice?.channelId ?? undefined;
    }

    /**
     * Check if this client should handle events (messages, interactions, etc.)
     *
     * Logic:
     * 1. If user is in a voice channel, check if any bot is already in that voice channel
     *    - If yes, only that bot should handle
     *    - If no, find an available bot (not in any voice channel in this guild)
     * 2. If user is not in voice, the primary client for the guild handles
     */
    public shouldHandleEvent(
        client: Client,
        guildId: string,
        userVoiceChannelId?: string,
    ): boolean {
        if (!client.user) {
            return false;
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return false;
        }

        // Get all registered clients (filter out undefined/null)
        const allClients = this.getClients();

        // If user is in a voice channel, use voice-aware logic
        if (userVoiceChannelId) {
            // Check if THIS client is in the user's voice channel
            const botVoiceChannelId = this.getBotVoiceChannelIdForClient(client.user.id, guildId, guild);
            if (botVoiceChannelId === userVoiceChannelId) {
                // This bot is in the same voice channel as user - it should handle
                return true;
            }

            // Check if ANY other bot is in the user's voice channel
            for (const c of allClients) {
                if (!c.user || c.user.id === client.user.id) {
                    continue;
                }
                const otherGuild = c.guilds.cache.get(guildId);
                if (!otherGuild) {
                    continue;
                }
                const otherVoiceChannelId = this.getBotVoiceChannelIdForClient(c.user.id, guildId, otherGuild);
                if (otherVoiceChannelId === userVoiceChannelId) {
                    // Another bot is in user's voice channel - this client should NOT handle
                    return false;
                }
            }

            // No bot is in user's voice channel yet
            // Find the first available bot (not in any voice channel in this guild)
            let selectedClientId: string | null = null;
            const debugInfo: string[] = [];
            for (const c of allClients) {
                if (!c.user) {
                    debugInfo.push("(no user)");
                    continue;
                }
                const cGuild = c.guilds.cache.get(guildId);
                if (!cGuild) {
                    debugInfo.push(`${c.user.tag}: not in guild`);
                    continue;
                }
                // Use manual tracking as primary, queue connection and member voice state as fallbacks
                const voiceChannelId = this.getBotVoiceChannelIdForClient(c.user.id, guildId, cGuild);
                debugInfo.push(`${c.user.tag}: voice=${voiceChannelId ?? "none"}`);
                if (!voiceChannelId && !selectedClientId) {
                    // This bot is available (not in voice) - select first available
                    selectedClientId = c.user.id;
                }
            }

            // Log debug info for troubleshooting multi-client voice selection
            if (allClients.length > 1) {
                console.log(`[MultiClient] Total clients: ${allClients.length}, User in voice ${userVoiceChannelId}`);
                console.log(`[MultiClient] Checking bots: ${debugInfo.join(", ")}`);
                console.log(`[MultiClient] Selected bot: ${selectedClientId ? allClients.find(c => c.user?.id === selectedClientId)?.user?.tag : "none (fallback to primary)"}`);
            }

            if (selectedClientId) {
                // An available bot was found - only that bot should handle
                return client.user.id === selectedClientId;
            }

            // All bots are in voice channels, fall back to primary
            return this.isPrimaryForGuild(client, guildId);
        }

        // User is not in voice channel - use standard priority logic
        return this.isPrimaryForGuild(client, guildId);
    }

    /**
     * Check if this client is the primary for a guild (lowest priority client in the guild)
     */
    private isPrimaryForGuild(client: Client, guildId: string): boolean {
        if (!client.user) {
            return false;
        }

        const allClients = this.getClients();
        for (const c of allClients) {
            if (c.user && c.guilds.cache.has(guildId)) {
                return c.user.id === client.user.id;
            }
        }

        return false;
    }

    /**
     * Get an available client for a voice connection in a guild.
     * Prefers clients that are not already in a voice channel in this guild.
     * Falls back to the primary client if all are busy.
     */
    public getAvailableClientForVoice(guildId: string): Client | undefined {
        const allClients = this.getClients();
        // First, find clients that are in this guild but not in a voice channel
        for (const client of allClients) {
            if (!client.user) {
                continue;
            }

            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                continue;
            }

            // Check if this client is already in a voice channel in this guild
            // Use manual tracking as primary, queue connection and member voice state as fallbacks
            const voiceChannelId = this.getBotVoiceChannelIdForClient(client.user.id, guildId, guild);
            if (!voiceChannelId) {
                return client;
            }
        }

        // All clients are in voice channels, return the primary
        return this.getPrimaryClientForGuild(guildId);
    }

    /**
     * Get the primary client for a specific guild (lowest priority client that is in the guild)
     */
    public getPrimaryClientForGuild(guildId: string): Client | undefined {
        const allClients = this.getClients();
        for (const client of allClients) {
            if (client.user && client.guilds.cache.has(guildId)) {
                return client;
            }
        }
        return undefined;
    }

    /**
     * Get all clients that are in a specific guild
     */
    public getClientsInGuild(guildId: string): Client[] {
        return this.getClients().filter((c) => c.user && c.guilds.cache.has(guildId));
    }

    /**
     * Check if multi-client mode is enabled (more than 1 client)
     */
    public isMultiClientMode(): boolean {
        return this.getClients().length > 1;
    }

    /**
     * Get the priority of a client
     */
    public getClientPriority(clientId: string): number {
        return this.clientPriorities.get(clientId) ?? -1;
    }
}
