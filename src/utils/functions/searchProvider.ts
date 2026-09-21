import { type SearchProvider } from "../../typings/index.js";

type SearchProviderHost = {
    data: {
        botSettings: {
            searchProvider?: string | null;
        };
    };
};

export function formatSearchProvider(provider: SearchProvider): string {
    return provider === "direct" ? "Direct" : "DSP";
}

export function normalizeSearchProvider(value: string | null | undefined): SearchProvider {
    return value?.trim().toLowerCase() === "direct" ? "direct" : "dsp";
}

export function parseSearchProviderInput(
    value: string | null | undefined,
): SearchProvider | "reset" | null {
    const normalized = value?.trim().toLowerCase() ?? "";
    if (normalized === "reset") {
        return "reset";
    }
    if (normalized === "dsp" || normalized === "direct") {
        return normalized;
    }
    return null;
}

export function resolveSearchProvider(client: SearchProviderHost): SearchProvider {
    return normalizeSearchProvider(client.data.botSettings.searchProvider);
}
