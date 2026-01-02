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
    public isPrimaryForGuild(client: Client, guild: Guild): boolean {
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
     * Only the primary client for the guild should handle events.
     */
    public shouldHandleEvent(client: Client, guildId: string): boolean {
        if (!client.user) {
            return false;
        }

        const clientPriority = this.clientPriorities.get(client.user.id);
        if (clientPriority === undefined) {
            return false;
        }

        // Find the lowest priority client that is in this guild
        for (const c of this.clients) {
            if (c?.user && c.guilds.cache.has(guildId)) {
                // This is the primary for this guild
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
            const voiceState = guild.members.cache.get(client.user.id)?.voice;
            if (!voiceState?.channel) {
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
