"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "./ThemeProvider";
import { useI18n } from "@/lib/i18n";
import LangSwitcher from "./LangSwitcher";
import { FiSun, FiMoon } from "react-icons/fi";


export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-lime-900/30 bg-slate-950">
      <div className="mx-auto flex max-w-5xl items-center px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-lime-400">
          <span className="text-2xl">☣</span>
          Stinkout
        </Link>
        <div className="flex flex-1 items-center justify-center gap-2">
          <Link
            href="/reviews"
            className="rounded-lg border border-slate-700 px-4 py-1.5 text-sm text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-300"
          >
            {t("nav.allReviews")}
          </Link>
          <Link
            href="/top"
            className="rounded-lg border border-red-900/40 px-4 py-1.5 text-sm text-red-400 transition-colors hover:border-red-700 hover:text-red-300"
          >
            {t("nav.worst")}
          </Link>
        </div>
        <nav className="flex items-center gap-3">
          <LangSwitcher />
          <button
            onClick={toggle}
            suppressHydrationWarning
            className="rounded-lg border border-slate-700 p-2 text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-300"
            title={theme === "dark" ? t("theme.light") : t("theme.dark")}
          >
            {theme === "dark" ? <FiSun className="text-sm" /> : <FiMoon className="text-sm" />}
          </button>
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-slate-800" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-700 text-sm font-bold text-white transition-colors hover:bg-lime-600"
              >
                {user.name.charAt(0).toUpperCase()}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 z-50 w-48 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
                  <div className="border-b border-slate-800 px-4 py-3">
                    <p className="text-sm font-medium text-slate-200">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
                  >
                    {t("nav.profile")}
                  </Link>
                  <Link
                    href="/review"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
                  >
                    {t("nav.submitReview")}
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      href="/admin/reviews"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-amber-400 transition-colors hover:bg-slate-800"
                    >
                      {t("nav.adminPanel")}
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full border-t border-slate-800 px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-slate-800"
                  >
                    {t("nav.logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-300"
              >
                {t("nav.signIn")}
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-lime-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-lime-500"
              >
                {t("nav.register")}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
