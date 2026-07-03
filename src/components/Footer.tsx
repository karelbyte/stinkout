"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { IoIosCafe } from "react-icons/io";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-[var(--border-color)] py-6 text-center text-sm text-[var(--text-muted)]">
      <div className="mb-2 flex items-center justify-center gap-4">
        <Link href="/about" className="text-slate-500 hover:text-slate-300 transition-colors">{t("footer.about")}</Link>
        <a
          href="https://buymeacoffee.com/stinkout"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-700/40 bg-amber-950/30 px-3 py-1.5 text-xs font-medium text-amber-400 transition-all hover:border-amber-600 hover:bg-amber-900/40 hover:text-amber-300 animate-pulse-subtle"
          title="Support Stinkout"
        >
          <IoIosCafe className="animate-bounce-subtle" size={18} />
          Buy me a coffee
        </a>
        <span>&copy; {new Date().getFullYear()} Stinkout</span>
      </div>
      <p>{t("footer.tagline")}</p>
    </footer>
  );
}
