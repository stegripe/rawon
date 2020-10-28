import { Structures } from "discord.js";
import type { IGuild, IServerQueue } from "../../typings";
import type Disc_11 from "./Disc_11";

Structures.extend("Guild", dJSGuild => class Guild extends dJSGuild implements IGuild {
    public client!: IGuild["client"];
    public queue: IServerQueue | null = null;
    public constructor(client: Disc_11, data: Guild) { super(client, data); }
});
