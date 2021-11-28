import { useState } from "react";

type ThemeName = "dark" | "light";

export function useTheme(): [ThemeName, (theme: ThemeName) => void] {
    const [theme, setTheme] = useState<ThemeName>(window.localStorage.getItem("disc11Theme") as ThemeName|null ?? "light");

    window.addEventListener("storage", ev => {
        if (ev.key === "disc11Theme" && (ev.oldValue !== ev.newValue)) {
            if ((ev.oldValue ?? "light") === "light") {
                setTheme("dark");
            } else {
                setTheme("light")
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
    }]
}
