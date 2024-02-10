import { createCmdDecorator } from "./createCmdDecorator.js";
import { createEmbed } from "../functions/createEmbed.js";

import { PermissionFlagsBits, PermissionResolvable } from "discord.js";

export function memberReqPerms(
    perms: PermissionResolvable,
    fallbackMsg: string
): ReturnType<typeof createCmdDecorator> {
    return createCmdDecorator(ctx => {
        if (!ctx.member!.permissions.has(perms)) {
            void ctx.reply({
                embeds: [createEmbed("error", fallbackMsg, true)]
            });
            return false;
        }
    });
}

export function botReqPerms(
    perms: PermissionResolvable,
    fallbackMsg: string
): ReturnType<typeof createCmdDecorator> {
    return createCmdDecorator(ctx => {
        if (!ctx.guild!.members.me!.permissions.has(perms)) {
            void ctx.reply({
                embeds: [createEmbed("error", fallbackMsg, true)]
            });
            return false;
        }
    });
}

export function isModerator(): ReturnType<typeof createCmdDecorator> {
    return memberReqPerms(
        [PermissionFlagsBits.ManageRoles],
        "Sorry, but you're not the server staff."
    );
}
