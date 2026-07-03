"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || t("register.error"));
      }
    } catch {
      setError(t("register.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4">
      <div className="w-full">
        <h1 className="mb-2 text-3xl font-bold text-slate-100">{t("register.title")}</h1>
        <p className="mb-8 text-slate-400">{t("register.subtitle")}</p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-800/50 bg-red-900/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-300">
              {t("register.name")}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-lime-600"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-300">
              {t("register.email")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-lime-600"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-300">
              {t("register.password")}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-lime-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-lime-600 py-3 font-medium text-white transition-colors hover:bg-lime-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? t("register.creating") : t("register.submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t("register.hasAccount")}{" "}
          <Link href="/login" className="text-lime-400 hover:text-lime-300">
            {t("register.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
