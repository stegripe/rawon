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
        if (message.guild?.queue === null) return message.channel.send(createEmbed("warn", "There is nothing playing."));
    });
}

export function isSameVoiceChannel(): any {
    return inhibit(message => {
        if (!message.guild?.me?.voice.channel) return undefined;
        if (message.member?.voice.channel?.id !== message.guild.queue?.voiceChannel?.id) {
            return message.channel.send(
                createEmbed("warn", "You need to be in a same voice channel as mine")
            );
        }
    });
}

export function isUserInTheVoiceChannel(): any {
    return inhibit(message => {
        if (!message.member?.voice.channel) {
            return message.channel.send(
                createEmbed("warn", "I'm sorry, but you need to be in a voice channel to do that")
            );
        }
    });
}

export function isValidVoiceChannel(): any {
    return inhibit(message => {
        const voiceChannel = message.member?.voice.channel;
        if (!voiceChannel?.joinable) {
            return message.channel.send(createEmbed("error", "I'm sorry, but I can't connect to your voice channel, make sure I have a proper permissions!"));
        }
        if (!voiceChannel.speakable) {
            voiceChannel.leave();
            return message.channel.send(createEmbed("error", "I'm sorry, but I can't speak in this voice channel, make sure I have a proper permissions!"));
        }
    });
}
