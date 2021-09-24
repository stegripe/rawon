import { DefineEvent } from "../utils/decorators/DefineEvent";
import { CommandContext } from "../structures/CommandContext";
import { BaseEvent } from "../structures/BaseEvent";
import { createEmbed } from "../utils/createEmbed";
import { Interaction, Permissions } from "discord.js";

@DefineEvent("interactionCreate")
export class InteractionCreateEvent extends BaseEvent {
    public async execute(interaction: Interaction): Promise<any> {
        if (!interaction.inGuild() || !this.client.commands.isReady) return;
        if (interaction.isButton()) {
            const val = this.client.utils.decode(interaction.customId);
            const user = val.split("_")[0] ?? "";
            const cmd = val.split("_")[1] ?? "";
            if (cmd === "delete-msg") {
                if (interaction.user.id !== user && !new Permissions(interaction.member.permissions as any).has("MANAGE_MESSAGES")) {
                    void interaction.reply({
                        ephemeral: true,
                        embeds: [
                            createEmbed("error", `Sorry, but that interaction is only for <@${user.toString()}> and the server staff.`, true)
                        ]
                    });
                } else {
                    const msg = await interaction.channel?.messages.fetch(interaction.message.id).catch(() => null);
                    if (msg?.deletable) {
                        void msg.delete();
                    }
                }
            }
        }
        const context = new CommandContext(interaction);
        if (interaction.isContextMenu()) {
            const data = interaction.options.getUser("user") ?? interaction.options.getMessage("message");
            const cmd = this.client.commands.find(x => (data as any).type === "MESSAGE" ? x.meta.contextChat === interaction.commandName : x.meta.contextUser === interaction.commandName);
            if (cmd) {
                context.additionalArgs.set("options", data);
                void cmd.execute(context);
            }
        }
        if (interaction.isCommand()) {
            const cmd = this.client.commands.filter(x => x.meta.slash !== undefined).find(x => x.meta.slash!.name === interaction.commandName);
            if (cmd) {
                void cmd.execute(context);
            }
        }
        if (interaction.isSelectMenu()) {
            const val = this.client.utils.decode(interaction.customId);
            const user = val.split("_")[0] ?? "";
            const cmd = val.split("_")[1] ?? "";
            const exec = (val.split("_")[2] ?? "yes") === "yes";
            if (interaction.user.id !== user) {
                void interaction.reply({
                    ephemeral: true,
                    embeds: [
                        createEmbed("error", `Sorry, but that interaction is only for <@${user.toString()}>`, true)
                    ]
                });
            }
            if (cmd && user === interaction.user.id && exec) {
                const command = this.client.commands.filter(x => x.meta.slash !== undefined).find(x => x.meta.name === cmd);
                if (command) {
                    context.additionalArgs.set("values", interaction.values);
                    void command.execute(context);
                }
            }
        }
    }
}
