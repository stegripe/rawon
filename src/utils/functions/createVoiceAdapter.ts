import {
    type DiscordGatewayAdapterCreator,
    type DiscordGatewayAdapterImplementerMethods,
    type DiscordGatewayAdapterLibraryMethods,
} from "@discordjs/voice";
import { type Rawon } from "../../structures/Rawon.js";

export function createVoiceAdapter(client: Rawon, guildId: string): DiscordGatewayAdapterCreator {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
        client.logger.error(
            `[VoiceAdapter] Cannot find guild ${guildId} in ${client.user?.tag}'s cache`,
        );
        throw new Error(`Guild ${guildId} not found in client cache`);
    }
    const baseAdapterCreator = guild.voiceAdapterCreator as DiscordGatewayAdapterCreator;
    return (
        methods: DiscordGatewayAdapterLibraryMethods,
    ): DiscordGatewayAdapterImplementerMethods => {
        const { onVoiceServerUpdate, onVoiceStateUpdate, destroy: destroyLibrary } = methods;
        const clientUserId = client.user?.id;
        const wrappedOnVoiceStateUpdate = (
            data: Parameters<typeof onVoiceStateUpdate>[0],
        ): void => {
            if (data.user_id === clientUserId) {
                onVoiceStateUpdate(data);
            } else {
                client.logger.debug(
                    `[VoiceAdapter] ${client.user?.tag} filtering out voice state update for user ${data.user_id} (not ${clientUserId})`,
                );
            }
        };
        const baseAdapter = baseAdapterCreator({
            onVoiceServerUpdate,
            onVoiceStateUpdate: wrappedOnVoiceStateUpdate,
            destroy: destroyLibrary,
        });
        return baseAdapter;
    };
}
