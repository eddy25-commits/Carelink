import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { LOCALES } from "./translations";

const LanguageContext = createContext(null);
const STORAGE_KEY = "carelink_language";
const DEFAULT_LANGUAGE = "en";

function detectInitialLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LOCALES[stored]) return stored;
  } catch {
    // localStorage unavailable (private browsing, etc) — fall through to default.
  }
  const browserLang = typeof navigator !== "undefined" ? navigator.language?.slice(0, 2) : null;
  return browserLang && LOCALES[browserLang] ? browserLang : DEFAULT_LANGUAGE;
}

function resolve(dict, key) {
  return key.split(".").reduce((node, part) => (node && typeof node === "object" ? node[part] : undefined), dict);
}

function interpolate(template, vars) {
  if (!vars) return template;
  return Object.entries(vars).reduce((str, [k, v]) => str.replaceAll(`{${k}}`, String(v)), template);
}

function pluralize(template, vars) {
  if (typeof template === "string" && template.includes("|") && vars && typeof vars.count === "number") {
    const forms = template.split("|");
    const chosen = vars.count === 1 ? forms[0] : forms[forms.length - 1];
    return chosen;
  }
  return template;
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(detectInitialLanguage);

  const setLanguage = useCallback((next) => {
    if (!LOCALES[next]) return;
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage failures — the choice just won't persist across reloads.
    }
  }, []);

  const t = useCallback(
    (key, vars) => {
      const value = resolve(LOCALES[language], key) ?? resolve(LOCALES[DEFAULT_LANGUAGE], key) ?? key;
      return typeof value === "string" ? interpolate(pluralize(value, vars), vars) : value;
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, availableLanguages: Object.keys(LOCALES) }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
