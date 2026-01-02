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
        }

        // Update priority when client becomes ready
        client.once("ready", () => {
            if (client.user) {
                this.clientPriorities.set(client.user.id, priority);
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
        for (const c of this.clients) {
            if (c?.user && c.guilds.cache.has(guild.id)) {
                // This is the primary for this guild
                return c.user.id === client.user.id;
            }
        }

        return false;
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

        // If user is in a voice channel, use voice-aware logic
        if (userVoiceChannelId) {
            // Check if THIS client is in the user's voice channel
            // Use guild.members.me for reliable bot member data
            const botVoiceState = guild.members.me?.voice;
            if (botVoiceState?.channelId === userVoiceChannelId) {
                // This bot is in the same voice channel as user - it should handle
                return true;
            }

            // Check if ANY other bot is in the user's voice channel
            for (const c of this.clients) {
                if (!c?.user || c.user.id === client.user.id) {
                    continue;
                }
                const otherGuild = c.guilds.cache.get(guildId);
                // Use guild.members.me for reliable bot member data
                const otherVoiceState = otherGuild?.members.me?.voice;
                if (otherVoiceState?.channelId === userVoiceChannelId) {
                    // Another bot is in user's voice channel - this client should NOT handle
                    return false;
                }
            }

            // No bot is in user's voice channel yet
            // Find the first available bot (not in any voice channel in this guild)
            let selectedClientId: string | null = null;
            for (const c of this.clients) {
                if (!c?.user) {
                    continue;
                }
                const cGuild = c.guilds.cache.get(guildId);
                if (!cGuild) {
                    continue;
                }
                // Use guild.members.me for reliable bot member data
                const cVoiceState = cGuild.members.me?.voice;
                if (!cVoiceState?.channelId) {
                    // This bot is available (not in voice)
                    selectedClientId = c.user.id;
                    break;
                }
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

        for (const c of this.clients) {
            if (c?.user && c.guilds.cache.has(guildId)) {
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
        // First, find clients that are in this guild but not in a voice channel
        for (const client of this.clients) {
            if (!client?.user) {
                continue;
            }

            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                continue;
            }

            // Check if this client is already in a voice channel in this guild
            // Use guild.members.me for reliable bot member data
            const voiceState = guild.members.me?.voice;
            if (!voiceState?.channelId) {
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
        for (const client of this.clients) {
            if (client?.user && client.guilds.cache.has(guildId)) {
                return client;
            }
        }
        return undefined;
    }

    /**
     * Get all clients that are in a specific guild
     */
    public getClientsInGuild(guildId: string): Client[] {
        return this.clients.filter((c) => c?.user && c.guilds.cache.has(guildId));
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
