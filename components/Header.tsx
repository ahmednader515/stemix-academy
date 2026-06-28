"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import type { UserRole } from "@/lib/types";
import { useT, useLocalizedEnumValue } from "./LocaleProvider";
import { BeHeaderSearch } from "@/components/be-home/BeHeaderSearch";

function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status !== "authenticated" || !session?.user) return null;

  const roleLabel: Record<UserRole, string> = {
    ADMIN: useLocalizedEnumValue("ADMIN", "header.role", "Admin"),
    ASSISTANT_ADMIN: useLocalizedEnumValue("ASSISTANT_ADMIN", "header.role", "Assistant admin"),
    STUDENT: useLocalizedEnumValue("STUDENT", "header.role", "Student"),
    TEACHER: useLocalizedEnumValue("TEACHER", "header.role", "Teacher"),
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="be-btn-outline px-4 py-2 text-sm"
      >
        {t("beHome.myAccount", "My account")}
      </button>
      {open && (
        <div className="absolute end-0 top-full z-50 mt-1 w-48 rounded-xl border border-[var(--be-border,#e2e8f0)] bg-white py-1 shadow-lg">
          <div className="border-b border-[var(--be-border,#e2e8f0)] px-3 py-2 text-xs text-[var(--be-muted)]">
            {session.user.name} · {roleLabel[session.user.role]}
          </div>
          <Link
            href="/dashboard"
            className="block px-3 py-2 text-sm hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            {t("header.dashboard", "Dashboard")}
          </Link>
          <Link
            href="/dashboard/profile"
            className="block px-3 py-2 text-sm hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            {t("header.editAccount", "Edit account")}
          </Link>
          <button
            type="button"
            className="w-full px-3 py-2 text-start text-sm text-red-600 hover:bg-slate-50"
            onClick={async () => {
              setOpen(false);
              try {
                await fetch("/api/auth/clear-session", { method: "POST", credentials: "include" });
              } catch {
                /* ignore */
              }
              signOut({ callbackUrl: "/" });
            }}
          >
            {t("header.logout", "Log out")}
          </button>
        </div>
      )}
    </div>
  );
}

const navLinkClass =
  "be-pill whitespace-nowrap rounded-full border border-[var(--be-border,#e2e8f0)] bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[var(--be-navy,#0c3d7a)] hover:text-[var(--be-navy,#0c3d7a)]";

export function Header({
  platformName,
  headerLogoUrl,
  platformSubscriptionExpiryLabel,
}: {
  platformName?: string | null;
  headerLogoUrl?: string | null;
  platformSubscriptionExpiryLabel?: string | null;
}) {
  const { data: session, status } = useSession();
  const t = useT();
  const trimmedName = platformName?.trim() ?? "";
  const displayName = trimmedName;
  const linkTitle = trimmedName || t("header.homePage", "Homepage");

  return (
    <header className="be-header sticky top-0 z-50 shadow-sm">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="flex items-center justify-between gap-2 py-2 sm:hidden">
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-2 truncate text-base font-bold text-[var(--be-navy,#0c3d7a)]" title={linkTitle}>
            {headerLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={headerLogoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : null}
            {displayName ? <span className="min-w-0 truncate">{displayName}</span> : null}
          </Link>
        </div>

        <div className="hidden min-h-[4.5rem] items-center gap-4 py-2 lg:flex">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold text-[var(--be-navy,#0c3d7a)]" title={linkTitle}>
            {headerLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={headerLogoUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--be-navy,#0c3d7a)] text-sm text-white">SA</span>
            )}
            {displayName ? <span className="max-w-[10rem] truncate">{displayName}</span> : null}
          </Link>

          <nav className="flex shrink-0 items-center gap-2">
            <Link href="/courses" className={navLinkClass}>
              {t("common.courses", "Courses")}
            </Link>
            <Link href="/courses?free=1" className={navLinkClass}>
              {t("beHome.freeSessions", "Free sessions")}
            </Link>
          </nav>

          <BeHeaderSearch />

          <div className="flex shrink-0 items-center gap-2">
            {status === "loading" ? (
              <span className="text-sm text-[var(--be-muted)]">...</span>
            ) : session ? (
              <UserMenu />
            ) : (
              <>
                <Link href="/login" className="be-btn-outline px-4 py-2 text-sm">
                  {t("beHome.myAccount", "My account")}
                </Link>
                <Link href="/register" className="be-btn-primary px-5 py-2 text-sm">
                  {t("header.register", "Create account")}
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="hidden items-center justify-between gap-2 pb-2 sm:flex lg:hidden">
          <nav className="flex min-w-0 items-center gap-2 overflow-x-auto">
            <Link href="/courses" className={navLinkClass}>{t("common.courses", "Courses")}</Link>
            <Link href="/#bundles" className={navLinkClass}>{t("beHome.bundlesNav", "Bundles")}</Link>
          </nav>
          {status === "loading" ? null : session ? (
            <UserMenu />
          ) : (
            <Link href="/register" className="be-btn-primary shrink-0 px-4 py-2 text-sm">
              {t("header.register", "Create account")}
            </Link>
          )}
        </div>
      </div>

      {platformSubscriptionExpiryLabel ? (
        <div className="border-t border-teal-500/35 bg-gradient-to-l from-teal-950/80 to-slate-900/90 py-2.5 text-center text-xs leading-relaxed text-teal-50 sm:text-sm">
          <span className="font-semibold text-teal-200">{t("header.platformSubscriptionActive", "You are subscribed to the platform subscription")}</span>
          {" — "}
          <span className="text-teal-100/95">
            {t("header.endsAt", "Expires at:")} <time className="font-medium text-white">{platformSubscriptionExpiryLabel}</time>
          </span>
        </div>
      ) : null}
    </header>
  );
}
