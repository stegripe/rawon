import {
    getTranslations,
    Locale,
    localeNames,
    Translations
} from "@/locales";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface LocaleContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: Translations;
    localeNames: typeof localeNames;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const STORAGE_KEY = "rawon-locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("en");

    useEffect(() => {
        // Get initial locale from localStorage or browser
        const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
        if (stored && (stored === "en" || stored === "id")) {
            setLocaleState(stored);
        } else {
            // Detect browser language
            const browserLang = navigator.language.toLowerCase();
            if (browserLang.startsWith("id")) {
                setLocaleState("id");
            }
        }
    }, []);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem(STORAGE_KEY, newLocale);
    };

    const t = getTranslations(locale);

    return (
        <LocaleContext.Provider value={{ locale, setLocale, t, localeNames }}>
            {children}
        </LocaleContext.Provider>
    );
}

export function useLocale() {
    const context = useContext(LocaleContext);
    if (context === undefined) {
        throw new Error("useLocale must be used within a LocaleProvider");
    }
    return context;
}
