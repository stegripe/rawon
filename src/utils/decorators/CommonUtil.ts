import { createCmdExecuteDecorator } from "./createCmdExecuteDecorator.js";
import { createEmbed } from "../functions/createEmbed.js";
import { PermissionsString } from "discord.js";

export function memberReqPerms(
    perms: PermissionsString[],
    fallbackMsg: string
): ReturnType<typeof createCmdExecuteDecorator> {
    return createCmdExecuteDecorator(ctx => {
        if (!ctx.member?.permissions.has(perms)) {
            void ctx.reply({
                embeds: [createEmbed("error", fallbackMsg, true)]
            });
            return false;
        }
    });
}

export function botReqPerms(
    perms: PermissionsString[],
    fallbackMsg: string
): ReturnType<typeof createCmdExecuteDecorator> {
    return createCmdExecuteDecorator(ctx => {
        if (!ctx.guild?.members.me?.permissions.has(perms)) {
            void ctx.reply({
                embeds: [createEmbed("error", fallbackMsg, true)]
            });
            return false;
        }
    });
}
