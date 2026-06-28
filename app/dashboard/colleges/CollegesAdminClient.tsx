"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";
import { useDashboardTable } from "@/lib/i18n/dashboard-table";
import { fillMessage } from "@/lib/i18n/interpolate";

export type CollegeRow = {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
};

export function CollegesAdminClient({ initialColleges }: { initialColleges: CollegeRow[] }) {
  const router = useRouter();
  const t = useT();
  const Co = "dashboard.collegesAdmin";
  const { dir, thClass } = useDashboardTable();

  const [colleges, setColleges] = useState(initialColleges);
  const [nameAr, setNameAr] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reload = useCallback(async () => {
    const res = await fetch("/api/colleges", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { colleges?: CollegeRow[] };
    if (data.colleges) setColleges(data.colleges);
  }, []);

  async function createCollege(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const trimmed = nameAr.trim();
    if (!trimmed) {
      setError(t(`${Co}.nameRequired`));
      return;
    }
    setFormLoading(true);
    const res = await fetch("/api/colleges", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nameAr: trimmed }),
    });
    const data = await res.json().catch(() => ({}));
    setFormLoading(false);
    if (!res.ok) {
      setError(data.error ?? t(`${Co}.createFailed`));
      return;
    }
    setSuccess(t(`${Co}.createSuccess`));
    setNameAr("");
    await reload();
    router.refresh();
  }

  async function removeCollege(row: CollegeRow) {
    const ok = window.confirm(fillMessage(t(`${Co}.confirmDelete`), { name: row.nameAr ?? row.name }));
    if (!ok) return;
    setError("");
    setSuccess("");
    const res = await fetch(`/api/colleges/${encodeURIComponent(row.id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? t(`${Co}.deleteFailed`));
      return;
    }
    setSuccess(t(`${Co}.deleteSuccess`));
    await reload();
    router.refresh();
  }

  return (
    <div className="space-y-8" dir={dir}>
      <div>
        <h2 className="text-xl font-bold text-[var(--color-foreground)]">{t(`${Co}.pageTitle`)}</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{t(`${Co}.pageIntro`)}</p>
      </div>

      {error ? (
        <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-[var(--radius-btn)] bg-[var(--color-primary)]/10 px-3 py-2 text-sm text-[var(--color-primary)]">{success}</div>
      ) : null}

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{t(`${Co}.addTitle`)}</h3>
        <form onSubmit={(e) => void createCollege(e)} className="mt-4 flex max-w-xl flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1">
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{t(`${Co}.nameLabel`)}</label>
            <input
              required
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder={t(`${Co}.namePlaceholder`)}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
            />
          </div>
          <button
            type="submit"
            disabled={formLoading}
            className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {formLoading ? t(`${Co}.saveBusy`) : t(`${Co}.saveIdle`)}
          </button>
        </form>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{t(`${Co}.listTitle`)}</h3>
        <div className="mt-4 overflow-x-auto" dir={dir}>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-muted)]">
                <th className={thClass}>{t(`${Co}.colName`)}</th>
                <th className={thClass}>{t(`${Co}.colActions`)}</th>
              </tr>
            </thead>
            <tbody>
              {colleges.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-[var(--color-muted)]">
                    {t(`${Co}.empty`)}
                  </td>
                </tr>
              ) : (
                colleges.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--color-border)]/60">
                    <td className="px-3 py-2 font-medium">{row.nameAr ?? row.name}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => void removeCollege(row)}
                        className="rounded-[var(--radius-btn)] border border-red-500/40 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-500/10"
                      >
                        {t(`${Co}.delete`)}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
