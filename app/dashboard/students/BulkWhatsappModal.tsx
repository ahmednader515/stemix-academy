"use client";

import { useMemo, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import { useDashboardTable } from "@/lib/i18n/dashboard-table";
import {
  OPEN_DELAY_MS,
  openWhatsappChatsSequential,
  type WhatsappRecipient,
} from "@/lib/whatsapp-bulk";

type Props = {
  recipients: WhatsappRecipient[];
  skippedCount: number;
  onClose: () => void;
};

export function BulkWhatsappModal({ recipients, skippedCount, onClose }: Props) {
  const t = useT();
  const { dir } = useDashboardTable();
  const P = "dashboard.studentsPage";
  const [message, setMessage] = useState("");
  const [opened, setOpened] = useState(false);
  const [progress, setProgress] = useState(0);

  const previewNames = useMemo(() => recipients.slice(0, 6).map((r) => r.name), [recipients]);

  function handleOpenChats() {
    if (recipients.length === 0 || !message.trim()) return;
    setOpened(true);
    setProgress(0);
    openWhatsappChatsSequential(recipients, message.trim(), (index) => {
      setProgress(index + 1);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        dir={dir}
        className="w-full max-w-lg rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-whatsapp-title"
      >
        <h3 id="bulk-whatsapp-title" className="text-lg font-semibold text-[var(--color-foreground)]">
          {t(`${P}.bulkWhatsappTitle`, "Send WhatsApp message")}
        </h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {t(
            `${P}.bulkWhatsappIntro`,
            "The same message will open in WhatsApp for each student with a valid number. Allow pop-ups in your browser if prompted.",
          )}
        </p>

        <div className="mt-4 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm">
          <p className="font-medium text-[var(--color-foreground)]">
            {t(`${P}.bulkWhatsappRecipientCount`, "{count} students with WhatsApp").replace(
              "{count}",
              String(recipients.length),
            )}
          </p>
          {previewNames.length > 0 ? (
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {previewNames.join("، ")}
              {recipients.length > previewNames.length
                ? ` ${t(`${P}.bulkWhatsappAndMore`, "and {count} more").replace("{count}", String(recipients.length - previewNames.length))}`
                : ""}
            </p>
          ) : null}
          {skippedCount > 0 ? (
            <p className="mt-2 text-xs text-amber-700">
              {t(`${P}.bulkWhatsappSkipped`, "{count} students skipped (no valid WhatsApp number)").replace(
                "{count}",
                String(skippedCount),
              )}
            </p>
          ) : null}
        </div>

        <div className="mt-4">
          <label htmlFor="bulk-whatsapp-message" className="block text-sm font-medium text-[var(--color-foreground)]">
            {t(`${P}.bulkWhatsappMessageLabel`, "Message")}
          </label>
          <textarea
            id="bulk-whatsapp-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            placeholder={t(`${P}.bulkWhatsappMessagePlaceholder`, "Write your message here…")}
          />
        </div>

        {opened && recipients.length > 0 ? (
          <p className="mt-3 text-sm text-[var(--color-primary)]">
            {t(`${P}.bulkWhatsappOpening`, "Opening chats… {done} / {total}")
              .replace("{done}", String(progress))
              .replace("{total}", String(recipients.length))}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
          >
            {t(`${P}.cancel`, "Cancel")}
          </button>
          <button
            type="button"
            onClick={handleOpenChats}
            disabled={recipients.length === 0 || !message.trim()}
            className="flex-1 rounded-[var(--radius-btn)] bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {t(`${P}.bulkWhatsappOpenChats`, "Open in WhatsApp")}
          </button>
        </div>

        {opened ? (
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            {t(
              `${P}.bulkWhatsappDelayHint`,
              "Chats open one every {seconds} seconds to avoid browser blocking.",
            ).replace("{seconds}", String(OPEN_DELAY_MS / 1000))}
          </p>
        ) : null}
      </div>
    </div>
  );
}
