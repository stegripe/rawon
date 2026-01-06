import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { type GuildData } from "../../typings/index.js";
import { OperationManager } from "./OperationManager.js";

export class SQLiteDataManager<T extends Record<string, any> = Record<string, GuildData>> {
    private readonly db: Database.Database;
    private readonly manager = new OperationManager();
    private _data: T | null = null;

    public constructor(public readonly dbPath: string) {
        this.ensureDirectory();
        this.db = new Database(this.dbPath, {
            verbose: undefined,
        });

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
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS guilds (
                guild_id TEXT PRIMARY KEY,
                locale TEXT,
                dj_enable INTEGER DEFAULT 0,
                dj_role TEXT
            )
        `);

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS request_channels (
                guild_id TEXT NOT NULL,
                bot_id TEXT NOT NULL,
                channel_id TEXT,
                message_id TEXT,
                PRIMARY KEY (guild_id, bot_id),
                FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
            )
        `);

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

        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_queue_states_guild ON queue_states(guild_id);
            CREATE INDEX IF NOT EXISTS idx_queue_states_bot ON queue_states(bot_id);
            CREATE INDEX IF NOT EXISTS idx_player_states_guild ON player_states(guild_id);
            CREATE INDEX IF NOT EXISTS idx_player_states_bot ON player_states(bot_id);
            CREATE INDEX IF NOT EXISTS idx_request_channels_guild ON request_channels(guild_id);
            CREATE INDEX IF NOT EXISTS idx_request_channels_bot ON request_channels(bot_id);
        `);
    }

    public get data(): T | null {
        return this._data;
    }

    public async load(): Promise<T | null> {
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

                const requestChannelsByGuild = new Map<
                    string,
                    { channel_id: string | null; message_id: string | null }
                >();
                for (const rc of requestChannels) {
                    if (!requestChannelsByGuild.has(rc.guild_id)) {
                        requestChannelsByGuild.set(rc.guild_id, {
                            channel_id: rc.channel_id,
                            message_id: rc.message_id,
                        });
                    }
                }

                for (const [guildId, rc] of requestChannelsByGuild.entries()) {
                    if (!data[guildId]) {
                        data[guildId] = {};
                    }
                    data[guildId].requestChannel = {
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

    public async save(data: () => T): Promise<T | null> {
        await this.manager.add(async () => {
            const dat = data();

            const transaction = this.db.transaction(() => {
                for (const [guildId, guildData] of Object.entries(dat) as [string, GuildData][]) {
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
                }
            });

            transaction();
        });

        return this.load() as Promise<T | null>;
    }

    public getQueueState(guildId: string, botId: string): GuildData["queueState"] | null {
        const result = this.db
            .prepare("SELECT * FROM queue_states WHERE guild_id = ? AND bot_id = ?")
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

    public async saveQueueState(
        guildId: string,
        botId: string,
        queueState: GuildData["queueState"],
    ): Promise<void> {
        if (!queueState) {
            return;
        }

        await this.manager.add(async () => {
            const guildStmt = this.db.prepare(`
                INSERT INTO guilds (guild_id, locale, dj_enable, dj_role)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(guild_id) DO NOTHING
            `);
            guildStmt.run(guildId, null, 0, null);

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

    public async deleteQueueState(guildId: string, botId: string): Promise<void> {
        await this.manager.add(async () => {
            this.db
                .prepare("DELETE FROM queue_states WHERE guild_id = ? AND bot_id = ?")
                .run(guildId, botId);
        });
    }

    public getPlayerState(guildId: string, botId: string): GuildData["playerState"] | null {
        const result = this.db
            .prepare("SELECT * FROM player_states WHERE guild_id = ? AND bot_id = ?")
            .get(guildId, botId) as
            | {
                  loop_mode: string;
                  shuffle: number;
                  volume: number;
                  filters_json: string | null;
              }
            | undefined;

        if (!result) {
            return null;
        }

        let filters: Record<string, boolean> = {};
        if (result.filters_json) {
            try {
                filters = JSON.parse(result.filters_json) as Record<string, boolean>;
            } catch {
                filters = {};
            }
        }

        return {
            loopMode: (result.loop_mode ?? "OFF") as "OFF" | "SONG" | "QUEUE",
            shuffle: result.shuffle === 1,
            volume: result.volume ?? 100,
            filters,
        };
    }

    public async savePlayerState(
        guildId: string,
        botId: string,
        playerState: GuildData["playerState"],
    ): Promise<void> {
        if (!playerState) {
            return;
        }

        await this.manager.add(async () => {
            const guildStmt = this.db.prepare(`
                INSERT INTO guilds (guild_id, locale, dj_enable, dj_role)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(guild_id) DO NOTHING
            `);
            guildStmt.run(guildId, null, 0, null);

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

    public async deletePlayerState(guildId: string, botId: string): Promise<void> {
        await this.manager.add(async () => {
            this.db
                .prepare("DELETE FROM player_states WHERE guild_id = ? AND bot_id = ?")
                .run(guildId, botId);
        });
    }

    public getRequestChannel(
        guildId: string,
        botId: string,
    ): { channelId: string | null; messageId: string | null } | null {
        const stmt = this.db.prepare(
            "SELECT * FROM request_channels WHERE guild_id = ? AND bot_id = ?",
        );
        const row = stmt.get(guildId, botId) as
            | {
                  channel_id: string | null;
                  message_id: string | null;
              }
            | undefined;

        if (!row) {
            return null;
        }

        return {
            channelId: row.channel_id,
            messageId: row.message_id,
        };
    }

    public async saveRequestChannel(
        guildId: string,
        botId: string,
        channelId: string | null,
        messageId: string | null,
    ): Promise<void> {
        await this.manager.add(async () => {
            const guildStmt = this.db.prepare(`
                INSERT INTO guilds (guild_id, locale, dj_enable, dj_role)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(guild_id) DO NOTHING
            `);
            guildStmt.run(guildId, null, 0, null);

            const stmt = this.db.prepare(`
                INSERT INTO request_channels (guild_id, bot_id, channel_id, message_id)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(guild_id, bot_id) DO UPDATE SET
                    channel_id = excluded.channel_id,
                    message_id = excluded.message_id
            `);
            stmt.run(guildId, botId, channelId, messageId);
        });
    }

    public async deleteRequestChannel(guildId: string, botId: string): Promise<void> {
        await this.manager.add(async () => {
            this.db
                .prepare("DELETE FROM request_channels WHERE guild_id = ? AND bot_id = ?")
                .run(guildId, botId);
        });
    }

    public getBotsWithRequestChannel(guildId: string): string[] {
        const stmt = this.db.prepare("SELECT bot_id FROM request_channels WHERE guild_id = ?");
        const rows = stmt.all(guildId) as { bot_id: string }[];
        return rows.map((row) => row.bot_id);
    }

    public getBotsWithPlayerState(guildId: string): string[] {
        const stmt = this.db.prepare("SELECT bot_id FROM player_states WHERE guild_id = ?");
        const rows = stmt.all(guildId) as { bot_id: string }[];
        return rows.map((row) => row.bot_id);
    }

    public getAllGuildIds(): string[] {
        const stmt = this.db.prepare("SELECT guild_id FROM guilds");
        const rows = stmt.all() as { guild_id: string }[];
        return rows.map((row) => row.guild_id);
    }

    public async deleteGuildData(guildId: string): Promise<void> {
        await this.manager.add(async () => {
            // With CASCADE enabled, deleting from guilds will automatically
            // delete related records from request_channels, player_states, and queue_states
            this.db.prepare("DELETE FROM guilds WHERE guild_id = ?").run(guildId);
        });
    }

    public close(): void {
        this.db.close();
    }
}
