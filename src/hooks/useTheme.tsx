import { useState } from "react";

type ThemeName = "dark" | "light" | "system";

function getStorageTheme(): ThemeName {
    return window.localStorage.getItem("disc11Theme") as ThemeName|null ?? "system";
}

export function isSystemThemePreferenceDark(): boolean {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useTheme(): [ThemeName, (theme: ThemeName) => void] {
    const [theme, setTheme] = useState<ThemeName>(getStorageTheme());

    window.addEventListener("storage", ev => {
        if (ev.key === "disc11Theme" && (ev.oldValue !== ev.newValue)) {
            switch ((ev.newValue ?? "system") as ThemeName) {
                case "dark": setTheme("dark"); break;
                case "light": setTheme("light"); break;
                case "system": setTheme("system"); break;
                default: setTheme("system"); break;
            }
        }
    });

    return [theme, (newTheme: ThemeName) => {
        window.localStorage.setItem("disc11Theme", newTheme);
        window.dispatchEvent(new StorageEvent("storage", {
            key: "disc11Theme",
            newValue: newTheme,
            oldValue: theme,
            storageArea: window.localStorage
        }));
    }];
}
