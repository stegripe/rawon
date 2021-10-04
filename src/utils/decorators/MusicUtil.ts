import { createEmbed } from "../createEmbed";
import { Inhibit } from "./Inhibit";
import i18n from "../../config";

type ResType = (target: unknown, key: string|symbol, descriptor: PropertyDescriptor) => PropertyDescriptor;

export function haveQueue(): ResType {
    return Inhibit(ctx => {
        if (!ctx.guild?.queue) return ctx.reply({ embeds: [createEmbed("warn", i18n.__("utils.musicDecorator.noQueue"))] });
    });
}

export function inVC(): ResType {
    return Inhibit(ctx => {
        if (!ctx.member?.voice.channel) return ctx.reply({ embeds: [createEmbed("warn", i18n.__("utils.musicDecorator.noInVC"))] });
    });
}

export function validVC(): ResType {
    return Inhibit(ctx => {
        const voiceChannel = ctx.member?.voice.channel;

        if (voiceChannel?.id === ctx.guild?.me?.voice.channel?.id) return undefined;
        if (!voiceChannel?.joinable) return ctx.reply({ embeds: [createEmbed("error", i18n.__("utils.musicDecorator.validVCJoinable"), true)] });
        if (!voiceChannel.permissionsFor(ctx.guild!.me!.id)?.has("SPEAK")) return ctx.reply({ embeds: [createEmbed("error", i18n.__("utils.musicDecorator.validVCPermission"), true)] });
    });
}

export function sameVC(): ResType {
    return Inhibit(ctx => {
        if (!ctx.guild?.me?.voice.channel) return;

        const botVC = ctx.guild.queue?.connection?.joinConfig.channelId ?? ctx.guild.me.voice.channel.id;
        if (ctx.member?.voice.channel?.id !== botVC) return ctx.reply({ embeds: [createEmbed("warn", i18n.__("utils.musicDecorator.sameVC"))] });
    });
}
