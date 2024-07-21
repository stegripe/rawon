import type { PermissionsString } from "discord.js";
import { createEmbed } from "../functions/createEmbed.js";
import { createCmdExecuteDecorator } from "./createCmdExecuteDecorator.js";

export function memberReqPerms(
    perms: PermissionsString[],
    fallbackMsg: string
): ReturnType<typeof createCmdExecuteDecorator> {
    return createCmdExecuteDecorator(ctx => {
        if (ctx.member?.permissions.has(perms) !== true) {
            void ctx.reply({
                embeds: [createEmbed("error", fallbackMsg, true)]
            });
            return false;
        }
        return true;
    });
}

export function botReqPerms(
    perms: PermissionsString[],
    fallbackMsg: string
): ReturnType<typeof createCmdExecuteDecorator> {
    return createCmdExecuteDecorator(ctx => {
        if (ctx.guild?.members.me?.permissions.has(perms) !== true) {
            void ctx.reply({
                embeds: [createEmbed("error", fallbackMsg, true)]
            });
            return false;
        }
        return true;
    });
}
