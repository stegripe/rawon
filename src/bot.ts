import "dotenv/config";
import { fetchAllUsers } from "./config";
import { Disc_11 } from "./structures/Disc_11";
import { BitFieldResolvable, IntentsString } from "discord.js";

const intents: BitFieldResolvable<IntentsString> = ["GUILDS", "GUILD_VOICE_STATES", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS"];

const client = new Disc_11({
    disableMentions: "everyone",
    fetchAllMembers: fetchAllUsers,
    messageCacheLifetime: 60,
    messageCacheMaxSize: Infinity,
    messageEditHistoryMaxSize: Infinity,
    messageSweepInterval: 180,
    ws: {
        intents: fetchAllUsers ? intents.concat(["GUILD_MEMBERS"]) : intents
    }
});

process.on("unhandledRejection", e => {
    client.logger.error("UNHANDLED_REJECTION: ", e);
});

process.on("uncaughtException", e => {
    client.logger.error("UNCAUGHT_EXCEPTION: ", e);
    client.logger.warn("Uncaught Exception detected. Restarting...");
    process.exit(1);
});

client.build(process.env.DISCORD_TOKEN!)
    .catch(e => client.logger.error("CLIENT_BUILD_ERR: ", e));
