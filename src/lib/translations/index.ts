import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";

// Translation types
export type Language = "en" | "es" | "fr";

export type TranslationKey = string;

// Translation dictionaries
export const translations: Record<Language, typeof en> = {
  en,
  es,
  fr,
};

// Default language
export const defaultLanguage: Language = "en";

// Get nested object value by dot notation path
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  
  return current;
}

// Translation function
export function createTranslator(lang: Language) {
  const dictionary = translations[lang];
  
  return function t(key: string, params?: Record<string, string | number>): string {
    const value = getNestedValue(dictionary as unknown as Record<string, unknown>, key);
    
    if (typeof value !== "string") {
      // Fallback to English
      const fallback = getNestedValue(en as unknown as Record<string, unknown>, key);
      if (typeof fallback !== "string") {
        return key; // Return key if not found
      }
      return fallback;
    }
    
    if (!params) {
      return value;
    }
    
    // Replace placeholders with params
    let result = value;
    for (const [paramKey, paramValue] of Object.entries(params)) {
      result = result.replace(new RegExp(`{${paramKey}}`, "g"), String(paramValue));
    }
    
    return result;
  };
}

// Simple translation hook helper
export function translate(key: string, lang: Language, params?: Record<string, string | number>): string {
  const t = createTranslator(lang);
  return t(key, params);
}

// Language names for UI
export const languageNames: Record<Language, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
};

// Language direction (ltr or rtl)
export const languageDirection: Record<Language, "ltr" | "rtl"> = {
  en: "ltr",
  es: "ltr",
  fr: "ltr",
};
