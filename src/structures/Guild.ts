import { Structures } from "discord.js";
import { IGuild } from "../../typings";
import { Disc_11 } from "./Disc_11";
import { ServerQueue } from "./ServerQueue";

Structures.extend("Guild", dJSGuild => class Guild extends dJSGuild implements IGuild {
    public client!: IGuild["client"];
    public queue: ServerQueue | null = null;
    public constructor(client: Disc_11, data: Guild) { super(client, data); }
});
