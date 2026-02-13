import { setTimeout } from "node:timers";
import { type CommandInteraction, type GuildMember, PermissionFlagsBits } from "discord.js";
import { type CommandContext as LocalCommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { createEmbed } from "../functions/createEmbed.js";
import { i18n__, i18n__mf } from "../functions/i18n.js";
import { createCmdExecuteDecorator } from "./createCmdExecuteDecorator.js";

export const haveQueue = createCmdExecuteDecorator((ctx) => {
    const client = ctx.client as Rawon;
    const __ = i18n__(client, ctx.guild);
    if (!ctx.guild?.queue) {
        void ctx.reply({
            embeds: [createEmbed("warn", __("utils.musicDecorator.noQueue"))],
        });
        return false;
    }
    return true;
});

export const inVC = createCmdExecuteDecorator((ctx) => {
    const client = ctx.client as Rawon;
    const __ = i18n__(client, ctx.guild);
    const member = ctx.member as GuildMember | null;
    if (!member?.voice.channel) {
        void ctx.reply({
            embeds: [createEmbed("warn", __("utils.musicDecorator.noInVC"))],
        });
        return false;
    }
    return true;
});

export const validVC = createCmdExecuteDecorator((ctx) => {
    const client = ctx.client as Rawon;
    const __ = i18n__(client, ctx.guild);
    const member = ctx.member as GuildMember | null;
    const voiceChannel = member?.voice.channel;

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
    const client = ctx.client as Rawon;
    const __ = i18n__(client, ctx.guild);
    const member = ctx.member as GuildMember | null;

    if (!client || !ctx.guild) {
        return true;
    }

    const thisBotGuild = client.guilds.cache.get(ctx.guild.id);
    if (!thisBotGuild) {
        return false;
    }

    if (client.config.isMultiBot) {
        const userVoiceChannelId = member?.voice.channel?.id ?? null;

        if (userVoiceChannelId) {
            const shouldRespond = client.multiBotManager.shouldRespondToMusicCommand(
                client,
                thisBotGuild,
                userVoiceChannelId,
            );

            if (!shouldRespond) {
                return false;
            }
        }
    }

    if (!thisBotGuild.members.me?.voice.channel) {
        return true;
    }

    const botVc =
        thisBotGuild.queue?.connection?.joinConfig.channelId ??
        thisBotGuild.members.me.voice.channel.id;
    if (member?.voice.channel?.id !== botVc) {
        void ctx.reply({
            embeds: [createEmbed("warn", __("utils.musicDecorator.sameVC"))],
        });
        return false;
    }

    return true;
});

export const useRequestChannel = createCmdExecuteDecorator((ctx) => {
    const localCtx = ctx as unknown as LocalCommandContext;
    const client = ctx.client as Rawon;
    const __ = i18n__(client, ctx.guild);
    const __mf = i18n__mf(client, ctx.guild);
    if (!ctx.guild) {
        return true;
    }

    if (localCtx.additionalArgs.get("fromSearch") !== undefined) {
        return true;
    }

    let requestChannel = client.requestChannelManager.getRequestChannel(ctx.guild);
    if (!requestChannel && client.config.isMultiBot) {
        const primaryBot = client.multiBotManager.getPrimaryBot();
        if (primaryBot && primaryBot !== client) {
            requestChannel = primaryBot.requestChannelManager.getRequestChannel(ctx.guild);
        }
    }
    if (requestChannel === null) {
        return true;
    }

    if (ctx.channel?.id === requestChannel.id && ctx.isCommandInteraction()) {
        // Schedule auto-deletion of slash command reply to keep request channel clean
        const interaction = localCtx.context as CommandInteraction;
        setTimeout(() => {
            void interaction
                .fetchReply()
                .then((reply) => {
                    if (reply.deletable) {
                        void reply.delete().catch(() => {
                            // Ignore deletion errors
                        });
                    }
                })
                .catch(() => {
                    // Ignore fetch errors
                });
        }, 60_000);
        return true;
    }

    if (ctx.channel?.id === requestChannel.id && !ctx.isCommandInteraction()) {
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
