"use client";

import { useState } from "react";
import { FiFlag } from "react-icons/fi";
import { useI18n } from "@/lib/i18n";

interface ReportButtonProps {
  reviewId: number;
}

export default function ReportButton({ reviewId }: ReportButtonProps) {
  const { t } = useI18n();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit() {
    if (reason.trim().length < 10) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (res.ok) {
        setMessage(t("report.success"));
        setReason("");
        setTimeout(() => { setShowModal(false); setMessage(null); }, 2000);
      } else {
        const data = await res.json();
        setMessage(data.error || t("report.error"));
      }
    } catch {
      setMessage(t("report.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-lg font-semibold text-slate-200">{t("report.modalTitle")}</h3>
            <p className="mb-4 text-sm text-slate-400">{t("report.modalBody")}</p>
            {message ? (
              <p className="text-sm text-slate-300">{message}</p>
            ) : (
              <>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("report.placeholder")}
                  rows={4}
                  className="mb-4 w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-lime-600"
                />
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowModal(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 transition-colors hover:border-slate-600">{t("report.cancel")}</button>
                  <button onClick={handleSubmit} disabled={reason.trim().length < 10 || submitting} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50">
                    {submitting ? "..." : t("report.submit")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors">
        <FiFlag className="text-sm" /> {t("report.report")}
      </button>
    </>
  );
}
