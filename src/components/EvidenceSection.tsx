"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export interface EvidenceItem {
  id: number;
  review_id: number;
  user_id: number | null;
  file_name: string;
  file_type: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
  validation_count: number;
  validated_by_me: boolean;
}

interface EvidenceSectionProps {
  evidence: EvidenceItem[];
  reviewId: number;
}

export default function EvidenceSection({ evidence: initialEvidence, reviewId }: EvidenceSectionProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [evidence, setEvidence] = useState<EvidenceItem[]>(initialEvidence);
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPreview(null);
    }
    if (preview) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [preview]);

  async function handleValidate(evidenceId: number) {
    if (!user) {
      router.push("/login");
      return;
    }

    setValidatingId(evidenceId);
    try {
      const res = await fetch(`/api/evidence/${evidenceId}/validate`, { method: "POST" });
      if (res.ok) {
        setEvidence((prev) =>
          prev.map((e) =>
            e.id === evidenceId
              ? { ...e, validation_count: e.validation_count + 1, validated_by_me: true }
              : e
          )
        );
      } else {
        const data = await res.json();
        if (data.error === "Already validated") {
          setEvidence((prev) =>
            prev.map((e) =>
              e.id === evidenceId ? { ...e, validated_by_me: true } : e
            )
          );
        }
      }
    } catch {
      // silent
    } finally {
      setValidatingId(null);
    }
  }

  async function handleUploadEvidence() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (uploadFiles.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("reviewId", reviewId.toString());
      uploadFiles.forEach((f) => formData.append("evidence", f));

      const res = await fetch("/api/evidence", { method: "POST", body: formData });
      if (res.ok) {
        setUploadFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch {
      // silent
    } finally {
      setUploading(false);
    }
  }

  if (evidence.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
        >
          <img
            src={preview}
            alt="Evidence preview"
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      )}

      <h4 className="font-medium text-slate-300">{t("evidence.title")}</h4>
      {evidence.map((item) => {
        const isImage = item.file_type.startsWith("image/");
        return (
          <div
            key={item.id}
            className="rounded-lg border border-slate-700 bg-slate-800/50 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FileIcon fileType={item.file_type} />
                  <span className="truncate text-sm text-slate-300">{item.file_name}</span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                  <span>{new Date(item.created_at).toLocaleDateString('en-US')}</span>
                  <span>{t("evidence.validations", { n: item.validation_count })}</span>
                </div>
                {isImage && (
                  <img
                    src={item.file_path}
                    alt={item.file_name}
                    className="mt-2 max-h-32 cursor-pointer rounded object-cover transition-opacity hover:opacity-80"
                    onClick={() => setPreview(item.file_path)}
                  />
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={item.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-slate-600 px-3 py-1 text-xs text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-300"
                >
                    {isImage ? t("evidence.open") : t("evidence.view")}
                </a>
                {user && !item.validated_by_me && (
                  <button
                    onClick={() => handleValidate(item.id)}
                    disabled={validatingId === item.id}
                    className="rounded bg-lime-600/20 px-3 py-1 text-xs text-lime-400 transition-colors hover:bg-lime-600/40 disabled:opacity-50"
                  >
                    {validatingId === item.id ? "..." : t("evidence.validate")}
                  </button>
                )}
                {item.validated_by_me && (
                  <span className="rounded bg-lime-900/30 px-3 py-1 text-xs text-lime-500">
                    {t("evidence.validated")}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {user && (
        <div className="rounded-lg border border-dashed border-slate-700 p-4">
          <p className="mb-2 text-xs text-slate-500">{t("evidence.addMore")}</p>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.eml"
              onChange={(e) => setUploadFiles(e.target.files ? Array.from(e.target.files) : [])}
              className="flex-1 text-xs text-slate-400 file:mr-2 file:rounded file:border-0 file:bg-lime-700 file:px-3 file:py-1 file:text-xs file:text-white"
            />
            <button
              onClick={handleUploadEvidence}
              disabled={uploadFiles.length === 0 || uploading}
              className="rounded bg-lime-700 px-4 py-1 text-xs text-white transition-colors hover:bg-lime-600 disabled:opacity-50"
            >
              {uploading ? "..." : t("evidence.upload")}
            </button>
          </div>
          {uploadFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              {uploadFiles.map((f, i) => (
                <div key={i} className="text-xs text-slate-500">
                  {f.name} ({(f.size / 1024).toFixed(0)}KB)
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FileIcon({ fileType }: { fileType: string }) {
  if (fileType.startsWith("image/")) return <span className="text-sm">🖼</span>;
  if (fileType.includes("pdf")) return <span className="text-sm">📄</span>;
  return <span className="text-sm">📎</span>;
}
