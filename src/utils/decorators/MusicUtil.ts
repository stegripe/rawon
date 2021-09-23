import { createEmbed } from "../createEmbed";
import { Inhibit } from "./Inhibit";

export function haveQueue(): any {
    return Inhibit(ctx => {
        if (!ctx.guild?.queue) return ctx.reply({ embeds: [createEmbed("warn", "There is nothing playing.")] });
    });
}

export function inVC(): any {
    return Inhibit(ctx => {
        if (!ctx.member?.voice.channel) return ctx.reply({ embeds: [createEmbed("warn", "Sorry, but you need to be in a voice channel to do that.")] });
    });
}

export function validVC(): any {
    return Inhibit(ctx => {
        const voiceChannel = ctx.member?.voice.channel;

        if (voiceChannel?.id === ctx.guild?.me?.voice.channel?.id) return undefined;
        if (!voiceChannel?.joinable) return ctx.reply({ embeds: [createEmbed("error", "Sorry, but I can't **`CONNECT`** to your voice channel, make sure I have the proper permissions.", true)] });
        if (!voiceChannel.permissionsFor(ctx.guild!.me!.id)?.has("SPEAK")) return ctx.reply({ embeds: [createEmbed("error", "Sorry, but I can't **`SPEAK`** in this voice channel, make sure I have the proper permissions.", true)] });
    });
}

export function sameVC(): any {
    return Inhibit(ctx => {
        if (!ctx.guild?.me?.voice.channel) return;

        const botVC = ctx.guild.queue?.connection?.joinConfig.channelId ?? ctx.guild.me.voice.channel.id;
        if (ctx.member?.voice.channel?.id !== botVC) return ctx.reply({ embeds: [createEmbed("warn", "You need to be in the same voice channel as mine.")] });
    });
}
