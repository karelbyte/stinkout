"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-[var(--border-color)] py-6 text-center text-sm text-[var(--text-muted)]">
      <div className="mb-2 flex items-center justify-center gap-4">
        <Link href="/about" className="text-slate-500 hover:text-slate-300 transition-colors">{t("footer.about")}</Link>
        <span>&copy; {new Date().getFullYear()} Stinkout</span>
      </div>
      <p>{t("footer.tagline")}</p>
    </footer>
  );
}
