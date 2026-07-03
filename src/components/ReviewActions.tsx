"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ReviewActionsProps {
  reviewId: number;
  reviewUserId: number | null;
}

export default function ReviewActions({ reviewId, reviewUserId }: ReviewActionsProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setUserId(data.user?.id ?? null))
      .catch(() => setUserId(null));
  }, []);

  const isOwner = userId !== null && reviewUserId !== null && userId === reviewUserId;

  if (!isOwner) return null;

  async function handleDelete() {
    if (!confirm("Delete this review? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
      router.refresh();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="mt-3 flex gap-2">
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="rounded border border-red-800 px-3 py-1 text-xs text-red-400 transition-colors hover:border-red-700 hover:text-red-300 disabled:opacity-50"
      >
        {deleting ? "..." : "Delete"}
      </button>
    </div>
  );
}
