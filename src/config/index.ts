import { PresenceData } from "../typings/index.js";
import { prefix } from "./env.js";
import { ActivityType, IntentsBitField, ClientOptions, Options } from "discord.js";

export const clientOptions: ClientOptions = {
    intents: [
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.Guilds
    ],
    makeCache: Options.cacheWithLimits({
        ...Options.DefaultSweeperSettings,
        ThreadManager: {
            maxSize: Infinity
        }
    }),
    sweepers: {
        ...Options.DefaultSweeperSettings,
        threads: {
            interval: 300,
            lifetime: 10800
        }
    }
};

export const presenceData: PresenceData = {
    activities: [
        { name: `my prefix is ${prefix}`, type: ActivityType.Playing },
        { name: "with {userCount} users", type: ActivityType.Playing },
        {
            name: "{textChannelCount} of text channels in {guildCount} guilds",
            type: ActivityType.Watching
        }
    ],
    interval: 60000,
    status: ["online"]
};

export * from "./constants.js";
export * from "./env.js";
