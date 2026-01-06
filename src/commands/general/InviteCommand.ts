import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__mf } from "../../utils/functions/i18n.js";

const INVITE_URL =
    "https://discord.com/oauth2/authorize?client_id=999162626036740138&permissions=4855722558221376&scope=bot%20applications.commands";

@Command({
    aliases: ["inv"],
    description: i18n.__("commands.general.invite.description"),
    name: "invite",
    slash: {
        options: [],
    },
    usage: "{prefix}invite",
})
export class InviteCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        const __mf = i18n__mf(this.client, ctx.guild);

        await ctx
            .send({
                embeds: [
                    createEmbed(
                        "info",
                        __mf("commands.general.invite.clickURL", {
                            url: INVITE_URL,
                        }),
                    ).setAuthor({
                        name: __mf("commands.general.invite.inviteTitle", {
                            bot: this.client.user?.username,
                        }),
                        iconURL: this.client.user?.displayAvatarURL(),
                    }),
                ],
            })
            .catch((error: unknown) => this.client.logger.error("PLAY_CMD_ERR:", error));
    }
}
