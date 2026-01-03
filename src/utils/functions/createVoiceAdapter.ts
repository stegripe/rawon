import {
    type DiscordGatewayAdapterCreator,
    type DiscordGatewayAdapterImplementerMethods,
    type DiscordGatewayAdapterLibraryMethods,
} from "@discordjs/voice";
import { type Rawon } from "../../structures/Rawon.js";

/**
 * Creates a voice adapter creator that explicitly uses a specific client.
 * This ensures that voice connections are created with the correct bot instance in multi-bot scenarios.
 * 
 * Uses the client's guild.voiceAdapterCreator but wraps it to ensure correct client usage.
 *
 * @param client - The Discord client instance to use for voice connections
 * @param guildId - The guild ID to get the correct guild's voiceAdapterCreator
 * @returns A DiscordGatewayAdapterCreator function that uses the specified client
 */
export function createVoiceAdapter(client: Rawon, guildId: string): DiscordGatewayAdapterCreator {
    // Get the guild object from this client to use its voiceAdapterCreator
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
        client.logger.error(
            `[VoiceAdapter] Cannot find guild ${guildId} in ${client.user?.tag}'s cache`,
        );
        throw new Error(`Guild ${guildId} not found in client cache`);
    }

    // Use the guild's built-in voiceAdapterCreator (which is already bound to this client)
    const baseAdapterCreator = guild.voiceAdapterCreator as DiscordGatewayAdapterCreator;

    // Wrap it to add our filtering logic
    return (methods: DiscordGatewayAdapterLibraryMethods): DiscordGatewayAdapterImplementerMethods => {
        const { onVoiceServerUpdate, onVoiceStateUpdate, destroy: destroyLibrary } = methods;

        // Get the client's user ID to filter voice state updates
        const clientUserId = client.user?.id;

        // Create a wrapped onVoiceStateUpdate that filters by user ID
        const wrappedOnVoiceStateUpdate = (data: Parameters<typeof onVoiceStateUpdate>[0]): void => {
            // CRITICAL: Only process voice state updates for this client's user ID
            // This prevents cross-bot interference in multi-bot scenarios
            if (data.user_id === clientUserId) {
                onVoiceStateUpdate(data);
            } else {
                client.logger.debug(
                    `[VoiceAdapter] ${client.user?.tag} filtering out voice state update for user ${data.user_id} (not ${clientUserId})`,
                );
            }
        };

        // Call the base adapter creator with wrapped methods
        const baseAdapter = baseAdapterCreator({
            onVoiceServerUpdate,
            onVoiceStateUpdate: wrappedOnVoiceStateUpdate,
            destroy: destroyLibrary,
        });

        // Return the base adapter (it's already bound to the correct client)
        return baseAdapter;
    };
}

