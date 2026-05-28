import { type Guild, type GuildMember, type Snowflake } from "discord.js";
import { isMultiBot } from "../../config/env.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";

export const MUSIC_COMMAND_TARGET_KEY = "musicCommandTarget";

export const PLAYBACK_MUSIC_COMMANDS = new Set([
    "play",
    "p",
    "add",
    "search",
    "sc",
    "volume",
    "vol",
    "loop",
    "repeat",
    "shuffle",
    "autoplay",
    "ap",
    "filter",
    "skip",
    "s",
    "skipto",
    "st",
    "pause",
    "resume",
    "stop",
    "disconnect",
    "dc",
    "remove",
    "seek",
    "nowplaying",
    "np",
    "queue",
    "q",
    "lyrics",
    "ly",
    "lyric",
]);

export type MusicCommandTarget = {
    client: Rawon;
    guild: Guild;
    member: GuildMember;
    voiceChannelId: Snowflake;
    isRemoteGuild: boolean;
    originGuildId: Snowflake | null;
    tokenIndex: number;
    hasQueueForVoiceChannel: boolean;
    isQueuePlaying: boolean;
};

type Candidate = MusicCommandTarget & {
    clientId: Snowflake;
};

export function isPlaybackMusicCommandName(name: string | null | undefined): boolean {
    return typeof name === "string" && PLAYBACK_MUSIC_COMMANDS.has(name.toLowerCase());
}

export function isPlaybackMusicCommand(
    name: string | null | undefined,
    aliases: readonly string[] = [],
): boolean {
    return (
        isPlaybackMusicCommandName(name) ||
        aliases.some((alias) => isPlaybackMusicCommandName(alias))
    );
}

export function shouldProcessPrefixMusicCommand(
    client: Rawon,
    guild: Guild,
    isMentionPrefix: boolean,
): boolean {
    if (!isMultiBot || isMentionPrefix) {
        return true;
    }

    return client.multiBotManager.shouldRespond(client, guild);
}

export function getMusicCommandTarget(ctx: CommandContext): MusicCommandTarget | null {
    return (
        (ctx.additionalArgs.get(MUSIC_COMMAND_TARGET_KEY) as MusicCommandTarget | undefined) ?? null
    );
}

export function copyMusicCommandTarget(source: CommandContext, target: CommandContext): void {
    const musicTarget = getMusicCommandTarget(source);
    if (!musicTarget) {
        return;
    }

    applyMusicCommandTarget(target, musicTarget);
}

export function encodeMusicCommandTargetSuffix(ctx: CommandContext): string {
    const target = getMusicCommandTarget(ctx);
    const botId = target?.client.user?.id;
    if (!target || !botId) {
        return "";
    }

    return `_yes_${botId}_${target.guild.id}`;
}

export async function applyMusicCommandTargetByIds(
    ctx: CommandContext,
    botId: string | undefined,
    guildId: string | undefined,
): Promise<MusicCommandTarget | null> {
    if (!botId || !guildId) {
        return null;
    }

    const originClient = ctx.context.client as Rawon;
    const targetClient =
        originClient.multiBotManager.getBotById(botId)?.client ??
        (originClient.user?.id === botId ? originClient : null);
    const guild = targetClient?.guilds.cache.get(guildId) ?? null;
    if (!targetClient || !guild) {
        return null;
    }

    const member = await getVoiceMember(guild, ctx.author.id);
    if (!member?.voice.channelId) {
        return null;
    }

    const target = createTarget(
        targetClient,
        guild,
        member,
        member.voice.channelId,
        ctx.originGuild?.id ?? null,
    );
    applyMusicCommandTarget(ctx, target);
    return target;
}

export async function resolveAndApplyMusicCommandTarget(
    ctx: CommandContext,
    commandName: string | null | undefined,
    aliases: readonly string[] = [],
): Promise<MusicCommandTarget | null> {
    if (!isPlaybackMusicCommand(commandName, aliases)) {
        return null;
    }

    const target = await resolveMusicCommandTarget(
        ctx.context.client as Rawon,
        ctx.originGuild ?? null,
        ctx.author.id,
    );
    if (!target) {
        return null;
    }

    applyMusicCommandTarget(ctx, target);
    return target;
}

function applyMusicCommandTarget(ctx: CommandContext, target: MusicCommandTarget): void {
    ctx.additionalArgs.set(MUSIC_COMMAND_TARGET_KEY, target);
    Object.defineProperty(ctx, "guild", {
        value: target.guild,
        writable: true,
        enumerable: true,
        configurable: true,
    });
}

async function resolveMusicCommandTarget(
    client: Rawon,
    originGuild: Guild | null,
    userId: Snowflake,
): Promise<MusicCommandTarget | null> {
    const originGuildId = originGuild?.id ?? null;
    const candidates = await getMusicTargetCandidates(client, originGuildId, userId);
    if (candidates.length === 0) {
        return null;
    }

    candidates.sort((a, b) => compareCandidates(a, b, originGuildId));
    const selected = candidates[0];
    return selected ?? null;
}

async function getMusicTargetCandidates(
    client: Rawon,
    originGuildId: Snowflake | null,
    userId: Snowflake,
): Promise<Candidate[]> {
    const botInstances = isMultiBot ? client.multiBotManager.getBots() : [];
    const clients = botInstances.length > 0 ? botInstances.map((bot) => bot.client) : [client];
    const seen = new Set<string>();
    const seenVoiceTargets = new Set<string>();
    const candidates: Candidate[] = [];

    for (const botClient of clients) {
        for (const guild of botClient.guilds.cache.values()) {
            const member = await getVoiceMember(guild, userId);
            const voiceChannelId = member?.voice.channelId ?? null;
            if (!member || !voiceChannelId) {
                continue;
            }

            const voiceTargetKey = `${guild.id}:${voiceChannelId}`;
            if (seenVoiceTargets.has(voiceTargetKey)) {
                continue;
            }
            seenVoiceTargets.add(voiceTargetKey);

            const responsibleClient =
                botClient.multiBotManager.getBotForVoiceChannel(guild, voiceChannelId) ?? botClient;
            const targetGuild = responsibleClient.guilds.cache.get(guild.id);
            if (!targetGuild) {
                continue;
            }

            const targetMember = await getVoiceMember(targetGuild, userId);
            if (!targetMember?.voice.channelId) {
                continue;
            }

            const target = createTarget(
                responsibleClient,
                targetGuild,
                targetMember,
                targetMember.voice.channelId,
                originGuildId,
            );
            const clientId = responsibleClient.user?.id ?? "unknown";
            const key = `${clientId}:${targetGuild.id}:${target.voiceChannelId}`;
            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            candidates.push({ ...target, clientId });
        }
    }

    return candidates;
}

async function getVoiceMember(guild: Guild, userId: Snowflake): Promise<GuildMember | null> {
    const voiceState = guild.voiceStates.cache.get(userId);
    const cachedMember = voiceState?.member ?? guild.members.cache.get(userId) ?? null;
    return cachedMember?.voice.channelId ? cachedMember : null;
}

function createTarget(
    client: Rawon,
    guild: Guild,
    member: GuildMember,
    voiceChannelId: Snowflake,
    originGuildId: Snowflake | null,
): MusicCommandTarget {
    const queueVoiceChannelId = guild.queue?.connection?.joinConfig.channelId ?? null;
    const hasQueueForVoiceChannel = queueVoiceChannelId === voiceChannelId;
    const tokenIndex = client.multiBotManager.getBotByClient(client)?.tokenIndex ?? 0;

    return {
        client,
        guild,
        member,
        voiceChannelId,
        isRemoteGuild: originGuildId !== null && guild.id !== originGuildId,
        originGuildId,
        tokenIndex,
        hasQueueForVoiceChannel,
        isQueuePlaying: hasQueueForVoiceChannel && guild.queue?.playing === true,
    };
}

function compareCandidates(a: Candidate, b: Candidate, originGuildId: Snowflake | null): number {
    const aIsOrigin = originGuildId !== null && a.guild.id === originGuildId;
    const bIsOrigin = originGuildId !== null && b.guild.id === originGuildId;
    if (aIsOrigin !== bIsOrigin) {
        return aIsOrigin ? -1 : 1;
    }

    if (a.isQueuePlaying !== b.isQueuePlaying) {
        return a.isQueuePlaying ? -1 : 1;
    }

    if (a.hasQueueForVoiceChannel !== b.hasQueueForVoiceChannel) {
        return a.hasQueueForVoiceChannel ? -1 : 1;
    }

    if (a.tokenIndex !== b.tokenIndex) {
        return a.tokenIndex - b.tokenIndex;
    }

    const guildOrder = a.guild.id.localeCompare(b.guild.id);
    if (guildOrder !== 0) {
        return guildOrder;
    }

    return a.clientId.localeCompare(b.clientId);
}
