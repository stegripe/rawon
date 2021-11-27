import { useState } from "react";

type ThemeName = "dark" | "light";

export function useTheme(): [ThemeName, (theme: ThemeName) => void] {
    const [theme, setTheme] = useState<ThemeName>(window.localStorage.getItem("disc11Theme") as ThemeName|null ?? "light");

    return [theme, (newTheme: ThemeName) => {
        window.localStorage.setItem("disc11Theme", newTheme);
        if (window.onstorage !== null) {
            window.onstorage(new StorageEvent("storage", {
                key: "disc11Theme",
                newValue: newTheme,
                oldValue: theme,
                storageArea: window.localStorage
            }))
        }
        setTheme(window.localStorage.getItem("disc11Theme") as ThemeName|null ?? "light");
    }]
}
