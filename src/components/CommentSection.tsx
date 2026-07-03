"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

interface Comment {
  id: number;
  review_id: number;
  user_id: number;
  user_name: string;
  body: string;
  created_at: string;
}

interface CommentSectionProps {
  reviewId: number;
}

export default function CommentSection({ reviewId }: CommentSectionProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [user, setUser] = useState<{ id: number } | null | "loading">("loading");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));

    fetch(`/api/reviews/${reviewId}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments || []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [reviewId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    if (user === "loading" || !user) {
      router.push("/login");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setBody("");
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <h4 className="text-sm font-medium text-slate-300">
{t("comments.title")} ({comments.length})
      </h4>

      {loading ? (
        <p className="text-xs text-slate-500">{t("comments.loading")}</p>
      ) : (
        <>
          {comments.length === 0 && (
            <p className="text-xs text-slate-500">{t("comments.noComments")}</p>
          )}
          <div className="space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="rounded-lg bg-slate-800/50 px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-300">{c.user_name}</span>
                  <span>{new Date(c.created_at).toLocaleDateString('en-US')}</span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{c.body}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={user && user !== "loading" ? t("comments.placeholder") : t("comments.loginToComment")}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-lime-600"
              disabled={user === "loading" || !user}
            />
            <button
              type="submit"
              disabled={!body.trim() || submitting || user === "loading" || !user}
              className="rounded-lg bg-lime-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-lime-500 disabled:opacity-50"
            >
              {submitting ? "..." : t("comments.post")}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
