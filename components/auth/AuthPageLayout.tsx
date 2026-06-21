import type { ReactNode } from "react";
import "./auth-pages.css";

export const authInputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20";

export const authPrimaryBtnClass =
  "w-full rounded-lg bg-[var(--color-primary)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50";

export function AuthPageLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="auth-page-shell">
      <div className="auth-page flex flex-col justify-center px-4 py-10 sm:py-14">
        <h1 className="auth-page-title">{title}</h1>
        {children}
      </div>
    </div>
  );
}
