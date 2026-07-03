"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-4xl font-bold text-slate-100">{t("about.title")}</h1>
      <div className="space-y-6 text-slate-400 leading-relaxed">
        <p>{t("about.p1")}</p>
        <p>{t("about.p2")}</p>
        <h2 className="text-xl font-semibold text-slate-200">{t("about.how")}</h2>
        <ul className="list-inside list-disc space-y-2">
          <li>{t("about.how1")}</li>
          <li>{t("about.how2")}</li>
          <li>{t("about.how3")}</li>
          <li>{t("about.how4")}</li>
        </ul>
        <p>{t("about.p3")}</p>
      </div>
      <div className="mt-8">
        <Link
          href="/review"
          className="inline-block rounded-lg bg-lime-600 px-6 py-3 font-medium text-white transition-colors hover:bg-lime-500"
        >
          {t("about.submitCta")}
        </Link>
      </div>
    </div>
  );
}
