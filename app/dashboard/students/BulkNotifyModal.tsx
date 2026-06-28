"use client";

import { useMemo, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import { useDashboardTable } from "@/lib/i18n/dashboard-table";

type StudentRecipient = { id: string; name: string };

type Props = {
  students: StudentRecipient[];
  onClose: () => void;
  onSent?: () => void;
};

export function BulkNotifyModal({ students, onClose, onSent }: Props) {
  const t = useT();
  const { dir } = useDashboardTable();
  const P = "dashboard.studentsPage";
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const previewNames = useMemo(() => students.slice(0, 6).map((s) => s.name), [students]);

  async function handleSend() {
    if (students.length === 0 || !message.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/students/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          studentIds: students.map((s) => s.id),
          message: message.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; sent?: number };
      if (!res.ok) {
        setError(data.error ?? t(`${P}.bulkNotifyFailed`, "Failed to send notification"));
        return;
      }
      setSuccessCount(data.sent ?? students.length);
      onSent?.();
    } catch {
      setError(t(`${P}.bulkNotifyFailed`, "Failed to send notification"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        dir={dir}
        className="w-full max-w-lg rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-notify-title"
      >
        <h3 id="bulk-notify-title" className="text-lg font-semibold text-[var(--color-foreground)]">
          {t(`${P}.bulkNotifyTitle`, "Send in-app notification")}
        </h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {t(
            `${P}.bulkNotifyIntro`,
            "The message will appear on the student dashboard for each selected student.",
          )}
        </p>

        <div className="mt-4 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]">
          {t(`${P}.bulkNotifyRecipientCount`, "{count} students").replace("{count}", String(students.length))}
          {previewNames.length > 0 ? (
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {previewNames.join("، ")}
              {students.length > previewNames.length
                ? ` ${t(`${P}.bulkWhatsappAndMore`, "and {count} more").replace("{count}", String(students.length - previewNames.length))}`
                : ""}
            </p>
          ) : null}
        </div>

        {successCount != null ? (
          <p className="mt-4 text-sm font-medium text-[var(--color-success,#059669)]">
            {t(`${P}.bulkNotifySuccess`, "Sent to {count} students").replace("{count}", String(successCount))}
          </p>
        ) : (
          <>
            <label htmlFor="bulk-notify-message" className="mt-4 block text-sm font-medium text-[var(--color-foreground)]">
              {t(`${P}.bulkNotifyMessageLabel`, "Message")}
            </label>
            <textarea
              id="bulk-notify-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              placeholder={t(`${P}.bulkNotifyMessagePlaceholder`, "Write your message here…")}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-60"
            />
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          </>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
          >
            {successCount != null ? t(`${P}.close`, "Close") : t("common.cancel", "Cancel")}
          </button>
          {successCount == null ? (
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={loading || students.length === 0 || !message.trim()}
              className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
            >
              {loading ? t(`${P}.bulkNotifySending`, "Sending…") : t(`${P}.bulkNotifySend`, "Send notification")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
