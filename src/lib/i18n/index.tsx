"use client";

import { createContext, useContext, useCallback, useSyncExternalStore } from "react";
import en from "./en";
import es from "./es";
export type { TranslationKey } from "./en";

type Lang = "en" | "es";
type Dict = typeof en;

const dicts: Record<Lang, Dict> = { en, es };

function detectBrowserLang(): Lang {
  try {
    const navLang = navigator.language?.slice(0, 2).toLowerCase();
    if (navLang === "es") return "es";
  } catch {}
  return "en";
}

function getLangSnapshot(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem("lang");
  if (stored === "en" || stored === "es") return stored;
  const detected = detectBrowserLang();
  try { localStorage.setItem("lang", detected); } catch {}
  return detected;
}

function subscribeLang(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

const I18nContext = createContext<{
  lang: Lang;
  t: (key: keyof Dict, params?: Record<string, string | number>) => string;
  setLang: (l: Lang) => void;
}>({
  lang: "en",
  t: (k) => en[k] || k,
  setLang: () => {},
});

export function useI18n() {
  return useContext(I18nContext);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribeLang, getLangSnapshot, (): Lang => "en");

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem("lang", l);
    document.documentElement.lang = l;
    document.cookie = `lang=${l};path=/;max-age=${60*60*24*365}`;
    window.dispatchEvent(new Event("storage"));
  }, []);

  const t = useCallback(
    (key: keyof Dict, params?: Record<string, string | number>) => {
      let val = dicts[lang][key] || en[key] || String(key);
      if (params) {
        const hasPlural = typeof params.n === "number" && params.n !== 1;
        const pluralKey = `${key}_plural` as keyof Dict;
        if (hasPlural && dicts[lang][pluralKey]) {
          val = dicts[lang][pluralKey] as string;
        } else if (hasPlural && en[pluralKey]) {
          val = en[pluralKey] as string;
        }
        for (const [k, v] of Object.entries(params)) {
          val = val.replace(`{${k}}`, String(v));
        }
      }
      return val;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, t, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}
