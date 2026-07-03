"use client";

import { Suspense, useState, FormEvent, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";

function ReviewForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const recruiterParam = searchParams.get("recruiter") || "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [recruiterName, setRecruiterName] = useState(recruiterParam);
  const [companyName, setCompanyName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) router.push("/login");
        else setCheckingAuth(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  if (checkingAuth) {
    return <div className="text-center text-slate-500">{t("common.checking")}</div>;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!recruiterName && !companyName) {
      setMessage({ type: "error", text: t("review.errorRecruiterOrCompany") });
      return;
    }
    if (!title || !description) {
      setMessage({ type: "error", text: t("review.errorRequired") });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("recruiterName", recruiterName);
      formData.append("companyName", companyName);
      formData.append("title", title);
      formData.append("description", description);
      files.forEach((f) => formData.append("evidence", f));

      const res = await fetch("/api/reviews", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: t("review.success") });
        setRecruiterName("");
        setCompanyName("");
        setTitle("");
        setDescription("");
        setFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setMessage({ type: "error", text: data.error || t("review.errorGeneric") });
      }
    } catch {
      setMessage({ type: "error", text: t("review.errorGeneric") });
    } finally {
      setSubmitting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <>
      <h1 className="mb-2 text-3xl font-bold text-slate-100">{t("review.title")}</h1>
      <p className="mb-8 text-slate-400">{t("review.subtitle")}</p>

      {message && (
        <div
          className={`mb-6 rounded-xl border p-4 ${
            message.type === "success"
              ? "border-lime-800/50 bg-lime-900/20 text-lime-400"
              : "border-red-800/50 bg-red-900/20 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="recruiter" className="mb-1 block text-sm font-medium text-slate-300">
              {t("review.recruiterName")}
            </label>
            <input
              id="recruiter"
              type="text"
              value={recruiterName}
              onChange={(e) => setRecruiterName(e.target.value)}
              placeholder={t("review.recruiterPlaceholder")}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-lime-600"
            />
          </div>
          <div>
            <label htmlFor="company" className="mb-1 block text-sm font-medium text-slate-300">
              {t("review.companyName")}
            </label>
            <input
              id="company"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder={t("review.companyPlaceholder")}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-lime-600"
            />
          </div>
        </div>

        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-300">
            {t("review.reviewTitle")}
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("review.titlePlaceholder")}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-lime-600"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-300">
            {t("review.description")}
          </label>
          <textarea
            id="description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("review.descriptionPlaceholder")}
            className="w-full resize-y rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-lime-600"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            {t("review.evidence")}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.eml"
            onChange={handleFileChange}
            className="w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-lime-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-lime-500"
          />
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-400">
                  <span className="truncate">{f.name} ({(f.size / 1024).toFixed(0)}KB)</span>
                  <button type="button" onClick={() => removeFile(i)} className="ml-2 text-red-400 hover:text-red-300">
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-lime-600 px-6 py-3 font-medium text-white transition-colors hover:bg-lime-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? t("review.submitting") : t("review.submit")}
        </button>
      </form>
    </>
  );
}

export default function ReviewPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Suspense fallback={<div className="text-center text-slate-500">Loading...</div>}>
        <ReviewForm />
      </Suspense>
    </div>
  );
}
