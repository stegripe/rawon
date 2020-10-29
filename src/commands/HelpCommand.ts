import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import type Disc_11 from "../structures/Disc_11";
import type { IMessage } from "../../typings";

export default class HelpCommand extends BaseCommand {
    public constructor(public client: Disc_11, public readonly path: string) {
        super(client, path, { aliases: ["command", "commands", "cmd", "cmds"] }, {
            name: "help",
            description: "Shows the help menu or command list",
            usage: "{prefix}help [command]"
        });
    }

    public execute(message: IMessage, args: string[]): void {
        const command = message.client.CommandsHandler.commands.get(args[0]) ?? message.client.CommandsHandler.commands.get(message.client.CommandsHandler.aliases.get(args[0])!);
        if (command && !command.conf.disable) {
            message.channel.send(new MessageEmbed()
                .setTitle(`Help for ${command.help.name} command`)
                .setThumbnail("https://hzmi.xyz/assets/images/question_mark.png")
                .addFields({ name: "Name", value: `\`${command.help.name}\``, inline: true },
                    { name: "Description", value: command.help.description, inline: true },
                    { name: "Aliases", value: `${Number(command.conf.aliases?.length) > 0 ? command.conf.aliases?.map(c => `\`${c}\``).join(", ") as string : "None."}`, inline: true },
                    { name: "Usage", value: `\`${command.help.usage?.replace(/{prefix}/g, message.client.config.prefix) as string}\``, inline: false })
                .setColor(this.client.config.embedColor)
                .setTimestamp()).catch(e => this.client.logger.error("HELP_CMD_ERR:", e));
        } else {
            message.channel.send(new MessageEmbed()
                .setTitle("Help Menu")
                .setColor(this.client.config.embedColor)
                .setThumbnail(message.client.user?.displayAvatarURL() as string)
                .setDescription(message.client.CommandsHandler.commands.filter(cmd => !cmd.conf.disable && cmd.help.name !== "eval").map(c => `\`${c.help.name}\``).join(" "))
                .setTimestamp()
                .setFooter(`Use ${message.client.config.prefix}help <command> to get more info on a specific command!`, "https://hzmi.xyz/assets/images/390511462361202688.png"))
                .catch(e => this.client.logger.error("HELP_CMD_ERR:", e));
        }
    }
}
