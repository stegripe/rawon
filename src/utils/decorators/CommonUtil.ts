import { createCmdExecuteDecorator } from "./createCmdExecuteDecorator";
import { createEmbed } from "../functions/createEmbed";
import { PermissionString } from "discord.js";

export function memberReqPerms(
    perms: PermissionString[],
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
    perms: PermissionString[],
    fallbackMsg: string
): ReturnType<typeof createCmdExecuteDecorator> {
    return createCmdExecuteDecorator(ctx => {
        if (!ctx.guild?.me?.permissions.has(perms)) {
            void ctx.reply({
                embeds: [createEmbed("error", fallbackMsg, true)]
            });
            return false;
        }
    });
}
