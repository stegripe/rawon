import { PermissionFlagsBits, type PermissionsString, type TextChannel } from "discord.js";
import { type Rawon } from "../../structures/Rawon.js";
import { createEmbed } from "../functions/createEmbed.js";
import { i18n__mf } from "../functions/i18n.js";
import { createCmdExecuteDecorator } from "./createCmdExecuteDecorator.js";

export function memberReqPerms(
    perms: PermissionsString[],
    fallbackMsg: string,
): ReturnType<typeof createCmdExecuteDecorator> {
    return createCmdExecuteDecorator((ctx) => {
        if (ctx.member?.permissions.has(perms) !== true) {
            void ctx.reply({
                embeds: [createEmbed("error", fallbackMsg, true)],
            });
            return false;
        }
        return true;
    });
}

export function botReqPerms(
    perms: PermissionsString[],
    fallbackMsg: string,
): ReturnType<typeof createCmdExecuteDecorator> {
    return createCmdExecuteDecorator((ctx) => {
        if (ctx.guild?.members.me?.permissions.has(perms) !== true) {
            void ctx.reply({
                embeds: [createEmbed("error", fallbackMsg, true)],
            });
            return false;
        }
        return true;
    });
}

export const checkBotChannelPermissions = createCmdExecuteDecorator(async (ctx) => {
    if (!ctx.guild?.members.me || !ctx.channel) {
        return true;
    }

    const channel = ctx.channel as TextChannel;
    const botPermissions = channel.permissionsFor?.(ctx.guild.members.me);

    if (botPermissions === null || botPermissions === undefined) {
        return true;
    }

    const requiredPerms = [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks];

    const missingPerms = requiredPerms.filter((perm) => !botPermissions.has(perm));

    if (missingPerms.length > 0) {
        const __mf = i18n__mf(ctx.client as Rawon, ctx.guild);
        const permNames = missingPerms.map((perm) => {
            if (perm === PermissionFlagsBits.SendMessages) {
                return "**`Send Messages`**";
            }
            if (perm === PermissionFlagsBits.EmbedLinks) {
                return "**`Embed Links`**";
            }
            return "**`Unknown`**";
        });

        try {
            await ctx.author.send({
                embeds: [
                    createEmbed(
                        "error",
                        __mf("utils.commonUtil.botMissingChannelPerms", {
                            permissions: permNames.join(", "),
                            channel: `<#${channel.id}>`,
                        }),
                        true,
                    ),
                ],
            });
        } catch {
            // Ignore errors
        }
        return false;
    }

    return true;
});
