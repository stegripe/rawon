import { CommandContext } from "../structures/CommandContext.js";
import { createEmbed } from "../utils/functions/createEmbed.js";
import { BaseEvent } from "../structures/BaseEvent.js";
import { Event } from "../utils/decorators/Event.js";
import i18n from "../config/index.js";
import { ApplicationCommandType, BitFieldResolvable, Interaction, Message, PermissionsBitField, PermissionsString, TextChannel } from "discord.js";

@Event("interactionCreate")
export class InteractionCreateEvent extends BaseEvent {
    public async execute(interaction: Interaction): Promise<void> {
        this.client.debugLog.logData("info", "INTERACTION_CREATE", [
            ["Type", interaction.type.toString()],
            ["Guild", interaction.inGuild() ? `${interaction.guild?.name ?? "[???]"}(${interaction.guildId})` : "DM"],
            [
                "Channel",
                (interaction.channel?.type ?? "DM") === "DM"
                    ? "DM"
                    : `${(interaction.channel as TextChannel).name}(${(interaction.channel as TextChannel).id})`
            ],
            ["User", `${interaction.user.tag}(${interaction.user.id})`]
        ]);

        if (!interaction.inGuild() || !this.client.commands.isReady) return;

        if (interaction.isButton()) {
            const val = this.client.utils.decode(interaction.customId);
            const user = val.split("_")[0] ?? "";
            const cmd = val.split("_")[1] ?? "";

            if (cmd === "delete-msg") {
                if (
                    interaction.user.id !== user &&
                    !new PermissionsBitField(
                        interaction.member.permissions as BitFieldResolvable<PermissionsString, bigint> | undefined
                    ).has(PermissionsBitField.Flags.ManageMessages)
                ) {
                    void interaction.reply({
                        ephemeral: true,
                        embeds: [
                            createEmbed(
                                "error",
                                i18n.__mf("events.createInteraction.message1", {
                                    user: user.toString()
                                }),
                                true
                            )
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
        if (interaction.isUserContextMenuCommand()) {
            const data = interaction.options.getUser("user") ?? interaction.options.getMessage("message");
            let dataType = ApplicationCommandType.User;

            if (data instanceof Message) {
                dataType = ApplicationCommandType.Message;
            }

            const cmd = this.client.commands.find(x =>
                dataType === ApplicationCommandType.Message
                    ? x.meta.contextChat === interaction.commandName
                    : x.meta.contextUser === interaction.commandName
            );
            if (cmd) {
                context.additionalArgs.set("options", data);
                void cmd.execute(context);
            }
        }

        if (interaction.isCommand()) {
            const cmd = this.client.commands
                .filter(x => x.meta.slash !== undefined)
                .find(x => x.meta.slash!.name === interaction.commandName);
            if (cmd) {
                void cmd.execute(context);
            }
        }

        if (interaction.isStringSelectMenu()) {
            const val = this.client.utils.decode(interaction.customId);
            const user = val.split("_")[0] ?? "";
            const cmd = val.split("_")[1] ?? "";
            const exec = (val.split("_")[2] ?? "yes") === "yes";

            if (interaction.user.id !== user) {
                void interaction.reply({
                    ephemeral: true,
                    embeds: [
                        createEmbed(
                            "error",
                            i18n.__mf("events.createInteraction.message1", {
                                user: user.toString()
                            }),
                            true
                        )
                    ]
                });
            }
            if (cmd && user === interaction.user.id && exec) {
                const command = this.client.commands
                    .filter(x => x.meta.slash !== undefined)
                    .find(x => x.meta.name === cmd);
                if (command) {
                    context.additionalArgs.set("values", interaction.values);
                    void command.execute(context);
                }
            }
        }
    }
}
