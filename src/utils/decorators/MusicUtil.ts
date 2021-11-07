import { CommandContext } from "../../structures/CommandContext";
import { createEmbed } from "../createEmbed";
import i18n from "../../config";

export function haveQueue(ctx: CommandContext): boolean {
    if (!ctx.guild?.queue) {
        void ctx.reply({ embeds: [createEmbed("warn", i18n.__("utils.musicDecorator.noQueue"))] });
        return false;
    }

    return true;
}

export function inVC(ctx: CommandContext): boolean {
    if (!ctx.member?.voice.channel) {
        void ctx.reply({ embeds: [createEmbed("warn", i18n.__("utils.musicDecorator.noInVC"))] });
        return false;
    }

    return true;
}

export function validVC(ctx: CommandContext): boolean {
    const voiceChannel = ctx.member?.voice.channel;

    if (voiceChannel?.id === ctx.guild?.me?.voice.channel?.id) return true;
    if (!voiceChannel?.joinable) {
        void ctx.reply({ embeds: [createEmbed("error", i18n.__("utils.musicDecorator.validVCJoinable"), true)] });
        return false;
    }
    if (!voiceChannel.permissionsFor(ctx.guild!.me!.id)?.has("SPEAK")) {
        void ctx.reply({ embeds: [createEmbed("error", i18n.__("utils.musicDecorator.validVCPermission"), true)] });
        return false;
    }

    return true;
}

export function sameVC(ctx: CommandContext): boolean {
    if (!ctx.guild?.me?.voice.channel) return true;

    const botVC = ctx.guild.queue?.connection?.joinConfig.channelId ?? ctx.guild.me.voice.channel.id;
    if (ctx.member?.voice.channel?.id !== botVC) {
        void ctx.reply({ embeds: [createEmbed("warn", i18n.__("utils.musicDecorator.sameVC"))] });
        return false;
    }

    return true;
}
