import { Precondition } from "@sapphire/framework";
import { type CommandInteraction, type Message } from "discord.js";

export class DevOnlyPrecondition extends Precondition {
    public override messageRun(message: Message): Precondition.Result {
        return this.checkDev(message.author.id);
    }

    public override chatInputRun(interaction: CommandInteraction): Precondition.Result {
        return this.checkDev(interaction.user.id);
    }

    public override contextMenuRun(interaction: CommandInteraction): Precondition.Result {
        return this.checkDev(interaction.user.id);
    }

    private checkDev(userId: string): Precondition.Result {
        return this.container.config.devs.includes(userId)
            ? this.ok()
            : this.error({ message: "This command can only be used by the bot developers." });
    }
}

declare module "@sapphire/framework" {
    interface Preconditions {
        DevOnly: never;
    }
}
