import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { OperationManager } from "./OperationManager.js";
import { type GuildData } from "../../typings/index.js";

/**
 * SQLite Data Manager for multi-bot support.
 * Provides same interface as JSONDataManager but uses SQLite database for better concurrency and scalability.
 * 
 * @template T - Type of data being managed (should be Record<string, GuildData>)
 */
export class SQLiteDataManager<T extends Record<string, any> = Record<string, GuildData>> {
    private readonly db: Database.Database;
    private readonly manager = new OperationManager();
    private _data: T | null = null;

    public constructor(public readonly dbPath: string) {
        this.ensureDirectory();
        this.db = new Database(this.dbPath, {
            verbose: undefined, // Disable SQL query logging
        });

        // Enable WAL mode for better concurrency
        this.db.pragma("journal_mode = WAL");
        this.db.pragma("foreign_keys = ON");

        this.initSchema();
        void this.load();
    }

    private ensureDirectory(): void {
        const dir = path.dirname(this.dbPath);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
    }

    private initSchema(): void {
        // Guilds table - stores basic guild settings
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS guilds (
                guild_id TEXT PRIMARY KEY,
                locale TEXT,
                dj_enable INTEGER DEFAULT 0,
                dj_role TEXT
            )
        `);

        // Request channels table - stores request channel configuration
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS request_channels (
                guild_id TEXT PRIMARY KEY,
                channel_id TEXT,
                message_id TEXT,
                FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
            )
        `);

        // Player states table - stores player settings (volume, loop, shuffle, filters) per guild and bot
        // bot_id is used to separate player states between bot instances in multi-bot mode
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS player_states (
                guild_id TEXT NOT NULL,
                bot_id TEXT NOT NULL,
                loop_mode TEXT DEFAULT 'OFF',
                shuffle INTEGER DEFAULT 0,
                volume INTEGER DEFAULT 100,
                filters_json TEXT DEFAULT '{}',
                PRIMARY KEY (guild_id, bot_id),
                FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
            )
        `);

        // Queue states table - stores queue state per guild (per bot instance in multi-bot)
        // bot_id is used to separate queue states between bot instances in multi-bot mode
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS queue_states (
                guild_id TEXT NOT NULL,
                bot_id TEXT NOT NULL,
                text_channel_id TEXT NOT NULL,
                voice_channel_id TEXT NOT NULL,
                songs_json TEXT NOT NULL,
                current_song_key TEXT,
                current_position INTEGER DEFAULT 0,
                PRIMARY KEY (guild_id, bot_id),
                FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
            )
        `);

        // Create indexes for better query performance
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_queue_states_guild ON queue_states(guild_id);
            CREATE INDEX IF NOT EXISTS idx_queue_states_bot ON queue_states(bot_id);
            CREATE INDEX IF NOT EXISTS idx_player_states_guild ON player_states(guild_id);
            CREATE INDEX IF NOT EXISTS idx_player_states_bot ON player_states(bot_id);
        `);
    }

    public get data(): T | null {
        return this._data;
    }

    /**
     * Load all guild data from database into memory cache
     */
    private async load(): Promise<T | null> {
        try {
            await this.manager.add(async () => {
                const guilds = this.db.prepare("SELECT * FROM guilds").all() as Array<{
                    guild_id: string;
                    locale: string | null;
                    dj_enable: number;
                    dj_role: string | null;
                }>;

                const requestChannels = this.db
                    .prepare("SELECT * FROM request_channels")
                    .all() as Array<{
                    guild_id: string;
                    channel_id: string | null;
                    message_id: string | null;
                }>;

                const data: Record<string, GuildData> = {};

                // Load guilds
                for (const guild of guilds) {
                    data[guild.guild_id] = {
                        locale: guild.locale ?? undefined,
                        dj:
                            guild.dj_enable !== 0 || guild.dj_role !== null
                                ? {
                                      enable: guild.dj_enable === 1,
                                      role: guild.dj_role,
                                  }
                                : undefined,
                    };
                }

                // Load request channels
                for (const rc of requestChannels) {
                    if (!data[rc.guild_id]) {
                        data[rc.guild_id] = {};
                    }
                    data[rc.guild_id].requestChannel = {
                        channelId: rc.channel_id,
                        messageId: rc.message_id,
                    };
                }

                this._data = data as T;
            });

            return this._data;
        } catch (error) {
            console.error("Failed to load data from SQLite:", error);
            return this.data;
        }
    }

    /**
     * Save data to database. Accepts a function that returns the data to save.
     * The function approach allows for atomic updates.
     * Compatible with JSONDataManager interface.
     */
    public async save(data: () => T): Promise<T | null> {
        await this.manager.add(async () => {
            const dat = data();

            // Start transaction
            const transaction = this.db.transaction(() => {
                // Update guilds
                for (const [guildId, guildData] of Object.entries(dat) as Array<[string, GuildData]>) {
                    // Upsert guild
                    const guildStmt = this.db.prepare(`
                        INSERT INTO guilds (guild_id, locale, dj_enable, dj_role)
                        VALUES (?, ?, ?, ?)
                        ON CONFLICT(guild_id) DO UPDATE SET
                            locale = excluded.locale,
                            dj_enable = excluded.dj_enable,
                            dj_role = excluded.dj_role
                    `);

                    guildStmt.run(
                        guildId,
                        guildData.locale ?? null,
                        guildData.dj?.enable ? 1 : 0,
                        guildData.dj?.role ?? null,
                    );

                    // Upsert request channel
                    if (guildData.requestChannel !== undefined) {
                        const rcStmt = this.db.prepare(`
                            INSERT INTO request_channels (guild_id, channel_id, message_id)
                            VALUES (?, ?, ?)
                            ON CONFLICT(guild_id) DO UPDATE SET
                                channel_id = excluded.channel_id,
                                message_id = excluded.message_id
                        `);

                        rcStmt.run(
                            guildId,
                            guildData.requestChannel.channelId ?? null,
                            guildData.requestChannel.messageId ?? null,
                        );
                    }
                }
            });

            transaction();
        });

        return this.load() as Promise<T | null>;
    }

    /**
     * Get queue state for a specific guild and bot (for multi-bot support)
     */
    public getQueueState(guildId: string, botId: string): GuildData["queueState"] | null {
        const result = this.db
            .prepare(
                "SELECT * FROM queue_states WHERE guild_id = ? AND bot_id = ?",
            )
            .get(guildId, botId) as
            | {
                  text_channel_id: string;
                  voice_channel_id: string;
                  songs_json: string;
                  current_song_key: string | null;
                  current_position: number;
              }
            | undefined;

        if (!result) {
            return null;
        }

        return {
            textChannelId: result.text_channel_id,
            voiceChannelId: result.voice_channel_id,
            songs: JSON.parse(result.songs_json),
            currentSongKey: result.current_song_key,
            currentPosition: result.current_position,
        };
    }

    /**
     * Save queue state for a specific guild and bot (for multi-bot support)
     */
    public async saveQueueState(
        guildId: string,
        botId: string,
        queueState: GuildData["queueState"],
    ): Promise<void> {
        if (!queueState) {
            return;
        }

        await this.manager.add(async () => {
            const stmt = this.db.prepare(`
                INSERT INTO queue_states (guild_id, bot_id, text_channel_id, voice_channel_id, songs_json, current_song_key, current_position)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(guild_id, bot_id) DO UPDATE SET
                    text_channel_id = excluded.text_channel_id,
                    voice_channel_id = excluded.voice_channel_id,
                    songs_json = excluded.songs_json,
                    current_song_key = excluded.current_song_key,
                    current_position = excluded.current_position
            `);

            stmt.run(
                guildId,
                botId,
                queueState.textChannelId,
                queueState.voiceChannelId,
                JSON.stringify(queueState.songs),
                queueState.currentSongKey ?? null,
                queueState.currentPosition ?? 0,
            );
        });
    }

    /**
     * Delete queue state for a specific guild and bot
     */
    public async deleteQueueState(guildId: string, botId: string): Promise<void> {
        await this.manager.add(async () => {
            this.db.prepare("DELETE FROM queue_states WHERE guild_id = ? AND bot_id = ?").run(guildId, botId);
        });
    }

    /**
     * Get player state for a specific guild and bot (for multi-bot support)
     */
    public getPlayerState(guildId: string, botId: string): GuildData["playerState"] | null {
        const result = this.db
            .prepare(
                "SELECT * FROM player_states WHERE guild_id = ? AND bot_id = ?",
            )
            .get(guildId, botId) as
            | {
                  loop_mode: string;
                  shuffle: number;
                  volume: number;
                  filters_json: string;
              }
            | undefined;

        if (!result) {
            return null;
        }

        return {
            loopMode: result.loop_mode as "OFF" | "SONG" | "QUEUE",
            shuffle: result.shuffle === 1,
            volume: result.volume,
            filters: JSON.parse(result.filters_json) as Record<string, boolean>,
        };
    }

    /**
     * Save player state for a specific guild and bot (for multi-bot support)
     */
    public async savePlayerState(
        guildId: string,
        botId: string,
        playerState: GuildData["playerState"],
    ): Promise<void> {
        if (!playerState) {
            return;
        }

        await this.manager.add(async () => {
            const stmt = this.db.prepare(`
                INSERT INTO player_states (guild_id, bot_id, loop_mode, shuffle, volume, filters_json)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(guild_id, bot_id) DO UPDATE SET
                    loop_mode = excluded.loop_mode,
                    shuffle = excluded.shuffle,
                    volume = excluded.volume,
                    filters_json = excluded.filters_json
            `);

            stmt.run(
                guildId,
                botId,
                playerState.loopMode,
                playerState.shuffle ? 1 : 0,
                playerState.volume,
                JSON.stringify(playerState.filters),
            );
        });
    }

    /**
     * Delete player state for a specific guild and bot
     */
    public async deletePlayerState(guildId: string, botId: string): Promise<void> {
        await this.manager.add(async () => {
            this.db.prepare("DELETE FROM player_states WHERE guild_id = ? AND bot_id = ?").run(guildId, botId);
        });
    }

    /**
     * Close database connection
     */
    public close(): void {
        this.db.close();
    }
}
