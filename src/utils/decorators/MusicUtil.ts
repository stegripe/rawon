import { PermissionFlagsBits } from "discord.js";
import { type Rawon } from "../../structures/Rawon.js";
import { createEmbed } from "../functions/createEmbed.js";
import { i18n__, i18n__mf } from "../functions/i18n.js";
import { createCmdExecuteDecorator } from "./createCmdExecuteDecorator.js";

export const haveQueue = createCmdExecuteDecorator((ctx) => {
    const __ = i18n__(ctx.guild?.client as Rawon, ctx.guild);
    if (!ctx.guild?.queue) {
        void ctx.reply({
            embeds: [createEmbed("warn", __("utils.musicDecorator.noQueue"))],
        });
        return false;
    }
    return true;
});

export const inVC = createCmdExecuteDecorator((ctx) => {
    const __ = i18n__(ctx.guild?.client as Rawon, ctx.guild);
    if (!ctx.member?.voice.channel) {
        void ctx.reply({
            embeds: [createEmbed("warn", __("utils.musicDecorator.noInVC"))],
        });
        return false;
    }
    return true;
});

export const validVC = createCmdExecuteDecorator((ctx) => {
    const __ = i18n__(ctx.guild?.client as Rawon, ctx.guild);
    const voiceChannel = ctx.member?.voice.channel;

    if (!ctx.guild?.members.me) {
        return true;
    }
    if (voiceChannel?.id === ctx.guild.members.me.voice.channel?.id) {
        return true;
    }
    if (voiceChannel?.joinable !== true) {
        void ctx.reply({
            embeds: [createEmbed("error", __("utils.musicDecorator.validVCJoinable"), true)],
        });

        return false;
    }
    if (!voiceChannel.permissionsFor(ctx.guild.members.me).has(PermissionFlagsBits.Speak)) {
        void ctx.reply({
            embeds: [createEmbed("error", __("utils.musicDecorator.validVCPermission"), true)],
        });
        return false;
    }

    return true;
});

export const sameVC = createCmdExecuteDecorator((ctx) => {
    const __ = i18n__(ctx.guild?.client as Rawon, ctx.guild);
    const client = ctx.guild?.client as Rawon;
    
    if (!client || !ctx.guild) {
        return true;
    }

    // CRITICAL: Always use THIS bot's guild object, not ctx.guild
    // ctx.guild might be from a different bot instance in multi-bot scenarios
    const thisBotGuild = client.guilds.cache.get(ctx.guild.id);
    if (!thisBotGuild) {
        // This bot doesn't have this guild, block command
        return false;
    }

    // Multi-bot: Check if this bot should respond based on voice channel
    if (client.config.isMultiBot) {
        const userVoiceChannelId = ctx.member?.voice.channel?.id ?? null;
        
        if (userVoiceChannelId) {
            // Check if this bot should respond to music command in user's voice channel
            const shouldRespond = client.multiBotManager.shouldRespondToMusicCommand(
                client,
                thisBotGuild,
                userVoiceChannelId,
            );

            if (!shouldRespond) {
                // Another bot is responsible for this voice channel, block command
                void ctx.reply({
                    embeds: [createEmbed("warn", __("utils.musicDecorator.sameVC"))],
                });
                return false;
            }
        }
    }

    // Normal sameVC check - use thisBotGuild, not ctx.guild
    // CRITICAL: Use thisBotGuild.members.me to get THIS bot's voice channel, not ctx.guild.members.me
    if (!thisBotGuild.members.me?.voice.channel) {
        return true;
    }

    // Use thisBotGuild.queue to get THIS bot's queue, not ctx.guild.queue
    const botVc =
        thisBotGuild.queue?.connection?.joinConfig.channelId ?? thisBotGuild.members.me.voice.channel.id;
    if (ctx.member?.voice.channel?.id !== botVc) {
        void ctx.reply({
            embeds: [createEmbed("warn", __("utils.musicDecorator.sameVC"))],
        });
        return false;
    }

    return true;
});

export const useRequestChannel = createCmdExecuteDecorator((ctx) => {
    const __ = i18n__(ctx.guild?.client as Rawon, ctx.guild);
    const __mf = i18n__mf(ctx.guild?.client as Rawon, ctx.guild);
    if (!ctx.guild) {
        return true;
    }

    if (ctx.additionalArgs.get("fromSearch") !== undefined) {
        return true;
    }

    const requestChannel = ctx.guild.client.requestChannelManager.getRequestChannel(ctx.guild);
    if (requestChannel === null) {
        return true;
    }

    if (ctx.channel?.id === requestChannel.id && ctx.isInteraction()) {
        return true;
    }

    if (ctx.channel?.id === requestChannel.id && !ctx.isInteraction()) {
        void ctx.reply({
            embeds: [createEmbed("warn", __("utils.musicDecorator.useRequestChannelDirect"))],
        });
        return false;
    }

    void ctx.reply({
        embeds: [
            createEmbed(
                "warn",
                __mf("utils.musicDecorator.useRequestChannel", {
                    channel: `<#${requestChannel.id}>`,
                }),
            ),
        ],
    });
    return false;
});
