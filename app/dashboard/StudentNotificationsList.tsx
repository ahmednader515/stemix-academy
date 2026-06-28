"use client";

import { useT } from "@/components/LocaleProvider";

export type NotificationItem = {
  id: string;
  message: string;
  senderName?: string;
  readAt?: string | null;
  createdAt: string;
};

function formatNotificationDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function StudentNotificationsList({
  items,
  emptyMessage,
}: {
  items: NotificationItem[];
  emptyMessage?: string;
}) {
  const t = useT();

  if (items.length === 0) {
    return (
      <p className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 p-10 text-center text-sm text-[var(--color-muted)]">
        {emptyMessage ?? t("dashboard.notificationsPage.empty", "No notifications yet.")}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((n) => {
        const isUnread = !n.readAt;
        return (
          <li
            key={n.id}
            className={`rounded-[var(--radius-btn)] border px-4 py-3 ${
              isUnread
                ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5"
                : "border-[var(--color-border)] bg-[var(--color-surface)]"
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-[var(--color-foreground)]">
                  {n.senderName?.trim() ||
                    t("dashboard.page.notificationFromPlatform", "Platform team")}
                </p>
                {isUnread ? (
                  <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {t("dashboard.notificationsPage.newBadge", "New")}
                  </span>
                ) : null}
              </div>
              <time className="text-xs text-[var(--color-muted)]">{formatNotificationDate(n.createdAt)}</time>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-foreground)]">
              {n.message}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
