"use client";

import { useI18n } from "@/lib/i18n";

export default function LangSwitcher() {
  const { lang, setLang } = useI18n();

  return (
    <button
      onClick={() => setLang(lang === "en" ? "es" : "en")}
      className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-300"
      title={lang === "en" ? "Español" : "English"}
    >
      {lang === "en" ? "ES" : "EN"}
    </button>
  );
}
