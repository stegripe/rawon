import { Structures } from "discord.js";
import type { IGuild, IServerQueue } from "../../typings";
import type Jukebox from "./Jukebox";

Structures.extend("Guild", dJSGuild => class Guild extends dJSGuild implements IGuild {
    public client!: IGuild["client"];
    public queue: IServerQueue | null = null;
    public constructor(client: Jukebox, data: Guild) { super(client, data); }
});
