import { Disc } from "./structures/Disc";
import { fetchAllUsers } from "./config";
import { Intents, LimitedCollection, Options } from "discord.js";

const intents = [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS];

const client = new Disc({
    allowedMentions: { parse: ["users"] },
    makeCache: Options.cacheWithLimits({
        MessageManager: { // Sweep messages every 5 minutes, removing messages that have not been edited or created in the last 3 hours
            maxSize: Infinity,
            sweepInterval: 300, // 5 Minutes
            sweepFilter: LimitedCollection.filterByLifetime({
                lifetime: 10800 // 3 Hours
            })
        },
        ThreadManager: { // Sweep threads every 5 minutes, removing threads that have been archived in the last 3 hours
            maxSize: Infinity,
            sweepInterval: 300, // 5 Minutes
            sweepFilter: LimitedCollection.filterByLifetime({
                lifetime: 10800, // 3 Hours
                getComparisonTimestamp: e => e.archiveTimestamp!,
                excludeFromSweep: e => !e.archived
            })
        }
    }),
    intents: fetchAllUsers ? intents.concat(Intents.FLAGS.GUILD_MEMBERS) : intents
});

process.on("unhandledRejection", e => {
    client.logger.error("UNHANDLED_REJECTION: ", e);
});

process.on("uncaughtException", e => {
    client.logger.error("UNCAUGHT_EXCEPTION: ", e);
    client.logger.warn("Uncaught Exception detected, restarting...");
    process.exit(1);
});

client.build(process.env.SECRET_DISCORD_TOKEN!)
    .catch(e => client.logger.error("CLIENT_BUILD_ERR: ", e));
