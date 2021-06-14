import { ServerQueue } from "./ServerQueue";
import { IGuild } from "../../typings";
import { Disc } from "./Disc";
import { Structures } from "discord.js";

Structures.extend("Guild", dJSGuild => class Guild extends dJSGuild implements IGuild {
    public client!: IGuild["client"];
    public queue: ServerQueue | null = null;
    public constructor(client: Disc, data: Guild) { super(client, data); }
});
