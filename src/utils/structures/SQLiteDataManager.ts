import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { type BotSettings, type GuildData } from "../../typings/index.js";
import { OperationManager } from "./OperationManager.js";

export const BOT_SETTINGS_DEFAULTS: BotSettings = {
    embedColor: "22C9FF",
    yesEmoji: "✅",
    noEmoji: "❌",
    altPrefix: ["{mention}"],
    requestChannelSplash: "https://cdn.stegripe.org/images/rawon_splash.png",
    defaultVolume: 100,
    musicSelectionType: "message",
    enableAudioCache: true,
};

export class SQLiteDataManager<T extends Record<string, GuildData> = Record<string, GuildData>> {
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
        this.loadBotSettings();
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
            CREATE TABLE IF NOT EXISTS cookies_state (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                current_cookie_index INTEGER DEFAULT 1,
                failed_cookies_json TEXT DEFAULT '[]',
                failure_timestamps_json TEXT DEFAULT '{}'
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

        const tableInfo = this.db.prepare("PRAGMA table_info(guilds)").all() as Array<{
            cid: number;
            name: string;
            type: string;
            notnull: number;
            dflt_value: string | null;
            pk: number;
        }>;

        const hasPrefixColumn = tableInfo.some((col) => col.name === "prefix");
        if (!hasPrefixColumn) {
            this.db.exec(`
                ALTER TABLE guilds ADD COLUMN prefix TEXT DEFAULT '';
            `);
        }

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS bot_settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                embed_color TEXT,
                yes_emoji TEXT,
                no_emoji TEXT,
                alt_prefix TEXT,
                request_channel_splash TEXT,
                default_volume INTEGER,
                music_selection_type TEXT,
                enable_audio_cache INTEGER
            )
        `);

        this.db.exec(`
            INSERT OR IGNORE INTO bot_settings (id) VALUES (1)
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
                    prefix: string | null;
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
                        prefix: guild.prefix ?? undefined,
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
                        INSERT INTO guilds (guild_id, locale, dj_enable, dj_role, prefix)
                        VALUES (?, ?, ?, ?, ?)
                        ON CONFLICT(guild_id) DO UPDATE SET
                            locale = excluded.locale,
                            dj_enable = excluded.dj_enable,
                            dj_role = excluded.dj_role,
                            prefix = excluded.prefix
                    `);

                    guildStmt.run(
                        guildId,
                        guildData.locale ?? null,
                        guildData.dj?.enable ? 1 : 0,
                        guildData.dj?.role ?? null,
                        guildData.prefix ?? null,
                    );
                }
            });

            transaction();
        });

        return this.load() as Promise<T | null>;
    }

    public getGuildIdsWithQueueState(botId: string): string[] {
        const rows = this.db
            .prepare("SELECT guild_id FROM queue_states WHERE bot_id = ?")
            .all(botId) as { guild_id: string }[];
        return rows.map((row) => row.guild_id);
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
                INSERT INTO guilds (guild_id, locale, dj_enable, dj_role, prefix)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(guild_id) DO NOTHING
            `);
            guildStmt.run(guildId, null, 0, null, null);

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
            volume: result.volume ?? this.botSettings.defaultVolume,
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
                INSERT INTO guilds (guild_id, locale, dj_enable, dj_role, prefix)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(guild_id) DO NOTHING
            `);
            guildStmt.run(guildId, null, 0, null, null);

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
                INSERT INTO guilds (guild_id, locale, dj_enable, dj_role, prefix)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(guild_id) DO NOTHING
            `);
            guildStmt.run(guildId, null, 0, null, null);

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

    public getPrefix(guildId: string): string | null {
        const result = this.db
            .prepare("SELECT prefix FROM guilds WHERE guild_id = ?")
            .get(guildId) as { prefix: string | null } | undefined;
        return result?.prefix ?? null;
    }

    public async setPrefix(guildId: string, prefix: string | null): Promise<void> {
        await this.manager.add(async () => {
            const updateStmt = this.db.prepare(`
                UPDATE guilds SET prefix = ? WHERE guild_id = ?
            `);
            const changes = updateStmt.run(prefix, guildId).changes;

            if (changes === 0) {
                const insertStmt = this.db.prepare(`
                    INSERT INTO guilds (guild_id, locale, dj_enable, dj_role, prefix)
                    VALUES (?, ?, ?, ?, ?)
                `);
                insertStmt.run(guildId, null, 0, null, prefix);
            }

            if (!this._data) {
                this._data = {} as T;
            }
            const data = this._data as Record<string, GuildData>;
            if (!data[guildId]) {
                data[guildId] = {};
            }
            if (prefix === null) {
                delete data[guildId].prefix;
            } else {
                data[guildId].prefix = prefix;
            }
        });
    }

    public async deleteGuildData(guildId: string): Promise<void> {
        await this.manager.add(async () => {
            this.db.prepare("DELETE FROM guilds WHERE guild_id = ?").run(guildId);
        });
    }

    public getCookiesState(): {
        currentCookieIndex: number;
        failedCookies: number[];
        failureTimestamps: Record<number, number>;
    } | null {
        const result = this.db.prepare("SELECT * FROM cookies_state WHERE id = 1").get() as
            | {
                  current_cookie_index: number;
                  failed_cookies_json: string;
                  failure_timestamps_json: string;
              }
            | undefined;

        if (!result) {
            return null;
        }

        return {
            currentCookieIndex: result.current_cookie_index,
            failedCookies: JSON.parse(result.failed_cookies_json),
            failureTimestamps: JSON.parse(result.failure_timestamps_json),
        };
    }

    public async saveCookiesState(state: {
        currentCookieIndex: number;
        failedCookies: number[];
        failureTimestamps: Record<number, number>;
    }): Promise<void> {
        await this.manager.add(async () => {
            const stmt = this.db.prepare(`
                INSERT INTO cookies_state (id, current_cookie_index, failed_cookies_json, failure_timestamps_json)
                VALUES (1, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    current_cookie_index = excluded.current_cookie_index,
                    failed_cookies_json = excluded.failed_cookies_json,
                    failure_timestamps_json = excluded.failure_timestamps_json
            `);

            stmt.run(
                state.currentCookieIndex,
                JSON.stringify(state.failedCookies),
                JSON.stringify(state.failureTimestamps),
            );
        });
    }

    private _botSettings: BotSettings = { ...BOT_SETTINGS_DEFAULTS };

    public get botSettings(): BotSettings {
        return this._botSettings;
    }

    private loadBotSettings(): void {
        const row = this.db.prepare("SELECT * FROM bot_settings WHERE id = 1").get() as
            | {
                  embed_color: string | null;
                  yes_emoji: string | null;
                  no_emoji: string | null;
                  alt_prefix: string | null;
                  request_channel_splash: string | null;
                  default_volume: number | null;
                  music_selection_type: string | null;
                  enable_audio_cache: number | null;
              }
            | undefined;

        if (!row) {
            this._botSettings = { ...BOT_SETTINGS_DEFAULTS };
            return;
        }

        this._botSettings = {
            embedColor: row.embed_color ?? BOT_SETTINGS_DEFAULTS.embedColor,
            yesEmoji: row.yes_emoji ?? BOT_SETTINGS_DEFAULTS.yesEmoji,
            noEmoji: row.no_emoji ?? BOT_SETTINGS_DEFAULTS.noEmoji,
            altPrefix: row.alt_prefix
                ? row.alt_prefix
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                : [...BOT_SETTINGS_DEFAULTS.altPrefix],
            requestChannelSplash:
                row.request_channel_splash ?? BOT_SETTINGS_DEFAULTS.requestChannelSplash,
            defaultVolume: row.default_volume ?? BOT_SETTINGS_DEFAULTS.defaultVolume,
            musicSelectionType:
                row.music_selection_type ?? BOT_SETTINGS_DEFAULTS.musicSelectionType,
            enableAudioCache:
                row.enable_audio_cache !== null
                    ? row.enable_audio_cache === 1
                    : BOT_SETTINGS_DEFAULTS.enableAudioCache,
        };
    }

    public async setBotSetting(key: string, value: string | number | null): Promise<void> {
        const validColumns = new Set([
            "embed_color",
            "yes_emoji",
            "no_emoji",
            "alt_prefix",
            "request_channel_splash",
            "default_volume",
            "music_selection_type",
            "enable_audio_cache",
        ]);

        if (!validColumns.has(key)) {
            throw new Error(`Invalid setting key: ${key}`);
        }

        await this.manager.add(async () => {
            const stmt = this.db.prepare(`UPDATE bot_settings SET ${key} = ? WHERE id = 1`);
            stmt.run(value);
            if (key === "yes_emoji") {
                this._botSettings.yesEmoji = (value as string) ?? BOT_SETTINGS_DEFAULTS.yesEmoji;
            } else if (key === "no_emoji") {
                this._botSettings.noEmoji = (value as string) ?? BOT_SETTINGS_DEFAULTS.noEmoji;
            }
            this.loadBotSettings();
        });
    }

    public close(): void {
        this.db.close();
    }
}
