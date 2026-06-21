"use client";

import { useState, useEffect, useCallback } from "react";
import { useT } from "@/components/LocaleProvider";
import { dateLocaleForUi } from "@/lib/i18n/dashboard-table";

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  messageType: "text" | "image" | "file";
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
};

type Props = {
  courseId: string;
  courseTitle: string;
  creatorId: string | null;
  creatorRole: string | null;
  userRole: string;
  userId: string;
  userName: string;
  /** When true, hide private tab (e.g. staff browsing course page) */
  groupOnly?: boolean;
  /** For staff private reply from dashboard */
  privateConversationId?: string | null;
  defaultTab?: "group" | "private";
  compact?: boolean;
};

const POLL_MS = 5000;

function mergeMessages(prev: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const map = new Map<string, ChatMessage>();
  for (const m of prev) map.set(m.id, m);
  for (const m of incoming) map.set(m.id, m);
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function CourseChatPanel({
  courseId,
  courseTitle,
  creatorId,
  creatorRole,
  userRole,
  userId,
  userName,
  groupOnly = false,
  privateConversationId = null,
  defaultTab = "group",
  compact = false,
}: Props) {
  const t = useT();
  const C = "courseChat";
  const dateLocale = dateLocaleForUi();

  const showPrivateTab = !groupOnly && !!creatorId && userRole === "STUDENT";
  const isStaffPrivateMode = !!privateConversationId;

  const [tab, setTab] = useState<"group" | "private">(
    isStaffPrivateMode ? "private" : defaultTab,
  );
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [privateMessages, setPrivateMessages] = useState<ChatMessage[]>([]);
  const [privateConvId, setPrivateConvId] = useState<string | null>(privateConversationId);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const creatorLabel = creatorRole
    ? t(`header.role.${creatorRole}`, creatorRole)
    : t(`${C}.courseCreator`, "منشئ الدورة");

  const loadGroup = useCallback(
    async (since?: string) => {
      const url = since
        ? `/api/courses/${encodeURIComponent(courseId)}/group-chat?since=${encodeURIComponent(since)}`
        : `/api/courses/${encodeURIComponent(courseId)}/group-chat`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error ?? "load failed");
      return Array.isArray(data) ? (data as ChatMessage[]) : [];
    },
    [courseId],
  );

  const loadPrivate = useCallback(
    async (since?: string) => {
      let url = `/api/courses/${encodeURIComponent(courseId)}/private-chat`;
      const params = new URLSearchParams();
      if (since) params.set("since", since);
      if (privateConversationId) params.set("conversationId", privateConversationId);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "load failed");
      if (data.conversationId) setPrivateConvId(data.conversationId);
      return (Array.isArray(data.messages) ? data.messages : []) as ChatMessage[];
    },
    [courseId, privateConversationId],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const load = async () => {
      try {
        if (tab === "group" && !isStaffPrivateMode) {
          const gm = await loadGroup();
          if (!cancelled) setGroupMessages(gm);
        }
        if (tab === "private" || isStaffPrivateMode) {
          const pm = await loadPrivate();
          if (!cancelled) setPrivateMessages(pm);
        }
      } catch {
        if (!cancelled) setError(t(`${C}.loadFailed`, "فشل تحميل الرسائل"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [courseId, tab, isStaffPrivateMode, loadGroup, loadPrivate, t]);

  useEffect(() => {
    const active = isStaffPrivateMode ? "private" : tab;
    const interval = setInterval(async () => {
      try {
        if (active === "group") {
          const last = groupMessages[groupMessages.length - 1];
          const incoming = await loadGroup(last?.createdAt);
          if (incoming.length) setGroupMessages((prev) => mergeMessages(prev, incoming));
        } else {
          const last = privateMessages[privateMessages.length - 1];
          const incoming = await loadPrivate(last?.createdAt);
          if (incoming.length) setPrivateMessages((prev) => mergeMessages(prev, incoming));
        }
      } catch {
        /* ignore poll errors */
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [tab, isStaffPrivateMode, groupMessages, privateMessages, loadGroup, loadPrivate]);

  async function sendMessage(content: string) {
    setSending(true);
    setError("");
    const active = isStaffPrivateMode ? "private" : tab;
    try {
      if (active === "group") {
        const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}/group-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ type: "text", content }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? t(`${C}.sendFailed`, "فشل الإرسال"));
          return;
        }
        setGroupMessages((prev) => mergeMessages(prev, [data as ChatMessage]));
      } else {
        const body: Record<string, string | undefined> = { type: "text", content };
        if (privateConvId) body.conversationId = privateConvId;
        const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}/private-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? t(`${C}.sendFailed`, "فشل الإرسال"));
          return;
        }
        if (data.conversationId) setPrivateConvId(data.conversationId);
        if (data.message) setPrivateMessages((prev) => mergeMessages(prev, [data.message as ChatMessage]));
      }
      setText("");
    } catch {
      setError(t(`${C}.sendFailed`, "فشل الإرسال"));
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    await sendMessage(trimmed);
  }

  const activeMessages = isStaffPrivateMode || tab === "private" ? privateMessages : groupMessages;
  const panelTitle = isStaffPrivateMode
    ? t(`${C}.privateChatTitle`, "سؤال خاص")
    : t(`${C}.panelTitle`, "محادثة الدورة");

  return (
    <section
      className={`rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] ${
        compact ? "p-4" : "p-5 sm:p-6"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={`font-semibold text-[var(--color-foreground)] ${compact ? "text-base" : "text-lg"}`}>
            {panelTitle}
          </h2>
          {!compact ? (
            <p className="mt-0.5 text-sm text-[var(--color-muted)]">{courseTitle}</p>
          ) : null}
        </div>
        {!isStaffPrivateMode && showPrivateTab ? (
          <div className="flex rounded-[var(--radius-btn)] border border-[var(--color-border)] p-0.5">
            <button
              type="button"
              onClick={() => setTab("group")}
              className={`rounded-[var(--radius-btn)] px-3 py-1.5 text-xs font-medium transition ${
                tab === "group"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {t(`${C}.tabGroup`, "محادثة الدورة")}
            </button>
            <button
              type="button"
              onClick={() => setTab("private")}
              className={`rounded-[var(--radius-btn)] px-3 py-1.5 text-xs font-medium transition ${
                tab === "private"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {t(`${C}.tabPrivate`, "سؤال خاص")}
            </button>
          </div>
        ) : null}
      </div>

      {tab === "private" && showPrivateTab && !isStaffPrivateMode ? (
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          {t(`${C}.privateHint`, "محادثة خاصة مع")} {creatorLabel}
        </p>
      ) : null}

      <div
        className={`mt-4 overflow-y-auto rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-3 ${
          compact ? "h-64" : "h-72 sm:h-80"
        }`}
      >
        {loading ? (
          <p className="text-center text-sm text-[var(--color-muted)]">{t(`${C}.loading`, "جاري التحميل...")}</p>
        ) : activeMessages.length === 0 ? (
          <p className="text-center text-sm text-[var(--color-muted)]">
            {t(`${C}.empty`, "لا توجد رسائل بعد. ابدأ المحادثة!")}
          </p>
        ) : (
          <ul className="space-y-3">
            {activeMessages.map((m) => {
              const isMine = m.senderId === userId;
              return (
                <li
                  key={m.id}
                  className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                >
                  <span className="mb-0.5 text-xs text-[var(--color-muted)]">
                    {isMine ? t(`${C}.you`, "أنت") : m.senderName || "—"}
                    {" · "}
                    {new Date(m.createdAt).toLocaleString(dateLocale, {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-[var(--radius-btn)] px-3 py-2 text-sm ${
                      isMine
                        ? "bg-[var(--color-primary)] text-white"
                        : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)]"
                    }`}
                  >
                    {m.messageType === "text" ? (
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    ) : m.messageType === "image" && m.fileUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.fileUrl} alt="" className="max-h-40 rounded object-contain" />
                    ) : m.fileUrl ? (
                      <a
                        href={m.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`font-medium underline ${isMine ? "text-white" : "text-[var(--color-primary)]"}`}
                      >
                        📎 {m.fileName ?? t(`${C}.attachment`, "مرفق")}
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder={t(`${C}.placeholder`, "اكتب رسالتك...")}
          className="min-h-[2.5rem] flex-1 resize-none rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
        >
          {sending ? t(`${C}.sending`, "جاري الإرسال...") : t(`${C}.send`, "إرسال")}
        </button>
      </form>
    </section>
  );
}
