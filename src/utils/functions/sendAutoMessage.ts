import { type Message, type MessageCreateOptions, MessageFlags } from "discord.js";

type MessageSender = {
    send(options: MessageCreateOptions): Promise<Message>;
};

export async function sendAutoMessage(
    channel: MessageSender,
    options: Omit<MessageCreateOptions, "flags">,
): Promise<Message> {
    return channel.send({
        ...options,
        flags: MessageFlags.SuppressNotifications,
    });
}
