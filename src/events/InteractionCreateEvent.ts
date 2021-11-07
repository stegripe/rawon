import { CommandContext } from "../structures/CommandContext";
import { BaseEvent } from "../structures/BaseEvent";
import { createEmbed } from "../utils/createEmbed";
import i18n from "../config";
import { BitFieldResolvable, Interaction, Permissions, PermissionString } from "discord.js";

export class InteractionCreateEvent extends BaseEvent {
    public constructor(client: BaseEvent["client"]) {
        super(client, "interactionCreate");
    }

    public async execute(interaction: Interaction): Promise<void> {
        if (!interaction.inGuild() || !this.client.commands.isReady) return;
        if (interaction.isButton()) {
            const val = this.client.utils.decode(interaction.customId);
            const user = val.split("_")[0] ?? "";
            const cmd = val.split("_")[1] ?? "";
            if (cmd === "delete-msg") {
                if (interaction.user.id !== user && !new Permissions(interaction.member.permissions as BitFieldResolvable<PermissionString, bigint>|undefined).has("MANAGE_MESSAGES")) {
                    void interaction.reply({
                        ephemeral: true,
                        embeds: [
                            createEmbed("error", i18n.__mf("events.createInteraction.message1", { user: user.toString() }), true)
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
                        createEmbed("error", i18n.__mf("events.createInteraction.message1", { user: user.toString() }), true)
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
