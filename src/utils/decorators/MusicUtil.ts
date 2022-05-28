import { createCmdExecuteDecorator } from "./createCmdExecuteDecorator";
import { createEmbed } from "../functions/createEmbed";
import i18n from "../../config";

export const haveQueue = createCmdExecuteDecorator(ctx => {
    if (!ctx.guild?.queue) {
        void ctx.reply({
            embeds: [createEmbed("warn", i18n.__("utils.musicDecorator.noQueue"))]
        });
        return false;
    }
});

export const inVC = createCmdExecuteDecorator(ctx => {
    if (!ctx.member?.voice.channel) {
        void ctx.reply({
            embeds: [createEmbed("warn", i18n.__("utils.musicDecorator.noInVC"))]
        });
        return false;
    }
});

export const validVC = createCmdExecuteDecorator(ctx => {
    const voiceChannel = ctx.member?.voice.channel;

    if (voiceChannel?.id === ctx.guild?.me?.voice.channel?.id) return;
    if (!voiceChannel?.joinable) {
        void ctx.reply({
            embeds: [createEmbed("error", i18n.__("utils.musicDecorator.validVCJoinable"), true)]
        });
        return false;
    }
    if (!voiceChannel.permissionsFor(ctx.guild!.me!.id)?.has("SPEAK")) {
        void ctx.reply({
            embeds: [createEmbed("error", i18n.__("utils.musicDecorator.validVCPermission"), true)]
        });
        return false;
    }
});

export const sameVC = createCmdExecuteDecorator(ctx => {
    if (!ctx.guild?.me?.voice.channel) return;

    const botVC = ctx.guild.queue?.connection?.joinConfig.channelId ?? ctx.guild.me.voice.channel.id;
    if (ctx.member?.voice.channel?.id !== botVC) {
        void ctx.reply({
            embeds: [createEmbed("warn", i18n.__("utils.musicDecorator.sameVC"))]
        });
        return false;
    }
});
