import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import Disc_11 from "../structures/Disc_11";
import { ICommandComponent, IMessage } from "../../typings";
import { DefineCommand } from "../utils/decorators/DefineCommand";

@DefineCommand({
    aliases: ["h", "command", "commands", "cmd", "cmds"],
    name: "help",
    description: "Shows the help menu or command list",
    usage: "{prefix}help [command]"
})
export default class HelpCommand extends BaseCommand {
    public constructor(public client: Disc_11, public meta: ICommandComponent["meta"]) { super(client, meta); }

    public execute(message: IMessage, args: string[]): void {
        const command = message.client.CommandsHandler.commands.get(args[0]) ??
            message.client.CommandsHandler.commands.get(message.client.CommandsHandler.aliases.get(args[0])!);
        if (command && !command.meta.disable) {
            message.channel.send(new MessageEmbed()
                .setTitle(`Information about ${command.meta.name} command`)
                .setThumbnail("https://hzmi.xyz/assets/images/question_mark.png")
                .addFields({ name: "Name", value: `\`${command.meta.name}\``, inline: true },
                    { name: "Description", value: command.meta.description, inline: true },
                    { name: "Aliases", value: `${Number(command.meta.aliases?.length) > 0 ? command.meta.aliases?.map(c => `\`${c}\``).join(", ") as string : "None."}`, inline: true },
                    { name: "Usage", value: `\`${command.meta.usage?.replace(/{prefix}/g, message.client.config.prefix) as string}\``, inline: false })
                .setColor(this.client.config.embedColor)
                .setTimestamp()).catch(e => this.client.logger.error("HELP_CMD_ERR:", e));
        } else {
            message.channel.send(new MessageEmbed()
                .setTitle("Commands list")
                .setColor(this.client.config.embedColor)
                .setThumbnail(message.client.user?.displayAvatarURL() as string)
                .setDescription(message.client.CommandsHandler.commands.filter(cmd => !cmd.meta.disable && cmd.meta.name !== "eval").map(c => `\`${c.meta.name}\``).join(" "))
                .setTimestamp()
                .setFooter(`Use ${message.client.config.prefix}help <command> to get more info on a specific command!`, "https://hzmi.xyz/assets/images/390511462361202688.png"))
                .catch(e => this.client.logger.error("HELP_CMD_ERR:", e));
        }
    }
}
