"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiShield, FiCheck } from "react-icons/fi";
import { useI18n } from "@/lib/i18n";

interface RatifyButtonProps {
  reviewId: number;
  initialCount: number;
  initialRatified: boolean;
}

export default function RatifyButton({ reviewId, initialCount, initialRatified }: RatifyButtonProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [user, setUser] = useState<{ id: number } | null | "loading">("loading");
  const [count, setCount] = useState(initialCount);
  const [ratified, setRatified] = useState(initialRatified);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  async function handleConfirm() {
    setShowModal(false);
    if (!user || user === "loading") {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/ratify`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setCount(data.count);
        setRatified(data.ratified);
        router.refresh();
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function handleClick() {
    if (user === "loading") return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (ratified) {
      handleConfirm();
    } else {
      setShowModal(true);
    }
  }

  return (
    <>
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-lg font-semibold text-slate-200">{t("ratify.modalTitle")}</h3>
            <p className="mb-6 text-sm text-slate-400">{t("ratify.modalBody")}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 transition-colors hover:border-slate-600"
              >
                {t("ratify.cancel")}
              </button>
              <button
                onClick={handleConfirm}
                className="rounded-lg bg-lime-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-lime-500"
              >
                {t("ratify.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleClick}
        disabled={loading || user === "loading"}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
          ratified
            ? "border-lime-700 bg-lime-900/30 text-lime-400"
            : "border-slate-700 text-slate-400 hover:border-lime-700 hover:text-lime-400"
        }`}
      >
        {ratified ? <FiCheck className="text-sm" /> : <FiShield className="text-sm" />}
        {ratified ? t("ratify.ratified") : t("ratify.ratify")}
        {count > 0 && <span className="ml-1 text-xs opacity-70">({count})</span>}
      </button>
    </>
  );
}
