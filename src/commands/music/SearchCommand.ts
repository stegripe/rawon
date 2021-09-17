import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { checkQuery } from "../../utils/handlers/GeneralUtil";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { SelectMenuInteraction, MessageActionRow, MessageSelectOptionData, MessageSelectMenu } from "discord.js";

@DefineCommand({
    aliases: [],
    contextChat: "Add to queue",
    description: "Play some track using provided query",
    name: "search",
    slash: {
        description: "Search the specified track",
        name: "search",
        options: [
            {
                description: "Query to search",
                name: "query",
                type: "STRING"
            },
            {
                choices: [
                    {
                        name: "YouTube",
                        value: "youtube"
                    },
                    {
                        name: "SoundCloud",
                        value: "soundcloud"
                    },
                    {
                        name: "Spotify",
                        value: "spotify"
                    }
                ],
                description: "Where the track should be taken?",
                name: "source",
                required: false,
                type: "STRING"
            }
        ]
    }
})
export class SearchCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<any> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const tracks = ctx.additionalArgs.get("values");
        if (tracks && ctx.isSelectMenu()) {
            for (const track of tracks) {
                const newCtx = new CommandContext(ctx.context, []);
                newCtx.additionalArgs.set("values", [track]);
                this.client.commands.get("play")!.execute(newCtx);
            }
            const msg = await ctx.channel!.messages.fetch((ctx.context as SelectMenuInteraction).message.id).catch(() => undefined);
            if (msg !== undefined) {
                const selection = msg.components[0].components.find(x => x.type === "SELECT_MENU");
                selection!.setDisabled(true);
                await msg.edit({ components: [new MessageActionRow().addComponents(selection!)] });
            }
            // return ctx.send({
            //     embeds: [
            //         createEmbed("success", `Added \`${tracks.length}\` tracks to queue`, true)
            //     ]
            // });
        }
        const query = (ctx.args.join(" ") || ctx.options?.getString("query")) ?? ctx.options?.getMessage("message")?.content;
        if (!query) {
            return ctx.send({
                embeds: [
                    createEmbed("warn", "Please provide some query to search.")
                ]
            });
        }
        if (checkQuery(query).isURL) {
            const newCtx = new CommandContext(ctx.context, [String(query)]);
            return this.client.commands.get("play")!.execute(newCtx);
        }
        // Perform search
        // const tracks = ...
        // if (!tracks.length) { ... }
        await ctx.send({
            content: `Please select some tracks`,
            components: [
                new MessageActionRow()
                    .addComponents(
                        new MessageSelectMenu()
                            .setMinValues(1)
                            .setMaxValues(10)
                            .setCustomId(Buffer.from(`${ctx.author.id}_${this.meta.name}`).toString("base64"))
                            .addOptions(this.generateSelectMenu([]))
                            .setPlaceholder("Select some tracks")
                    )
            ]
        });
        return ctx.send(query);
    }

    private generateSelectMenu(tracks: any): MessageSelectOptionData[] {
        const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
        // Replace this with new object (track typingss)
        return tracks.slice(0, 10).map((x: any, i: number) => (
            {
                label: x.title.length > 98 ? `${x.title.substr(0, 97)}...` : x.title,
                emoji: emojis[i],
                description: `${x.author}`,
                value: x.uri
            }
        ));
    }
}
