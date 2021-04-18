/* eslint-disable func-names */
import { ICommandComponent, IMessage } from "../../../typings";
import { createEmbed } from "../createEmbed";

export function inhibit(func: ICommandComponent["execute"]) {
    return function decorate(target: unknown, key: string | symbol, descriptor: PropertyDescriptor): any {
        const original = descriptor.value;
        descriptor.value = async function (message: IMessage, args: string[]): Promise<any> {
            const result = await func(message, args);
            if (result === undefined) return original.apply(this, [message, args]);
            return null;
        };

        return descriptor;
    };
}

export function isMusicPlaying(): any {
    return inhibit(message => {
        if (message.guild?.queue === null) return message.channel.send(createEmbed("warn", "There is nothing playing"));
    });
}

export function isSameVoiceChannel(): any {
    return inhibit(message => {
        if (!message.guild?.me?.voice.channel) return undefined;
        const botVoiceChannel = message.guild.queue?.voiceChannel?.id ?? message.guild.me.voice.channel.id;
        if (message.member?.voice.channel?.id !== botVoiceChannel) {
            return message.channel.send(
                createEmbed("warn", "You need to be in the same voice channel as mine")
            );
        }
    });
}

export function isUserInTheVoiceChannel(): any {
    return inhibit(message => {
        if (!message.member?.voice.channel) {
            return message.channel.send(
                createEmbed("warn", "Sorry, but you need to be in a voice channel to do that")
            );
        }
    });
}

export function isValidVoiceChannel(): any {
    return inhibit(message => {
        const voiceChannel = message.member?.voice.channel;
        if (voiceChannel?.id === message.guild?.me?.voice.channel?.id) return undefined;
        if (!voiceChannel?.joinable) {
            return message.channel.send(createEmbed("error", "Sorry, but I need **\`CONNECT\`** permission to do this"));
        }
        if (!voiceChannel.speakable) {
            voiceChannel.leave();
            return message.channel.send(createEmbed("error", "Sorry, but I need **\`SPEAK\`** permission to do this"));
        }
    });
}
