"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";
import { useDashboardTable, dateLocaleForUi } from "@/lib/i18n/dashboard-table";
import type { CourseRequestRow } from "@/lib/course-request-rows";

type AttachmentRow = CourseRequestRow["attachments"][number];

type RequestRow = CourseRequestRow;

const P = "dashboard.courseRequestsPage";
const DASH = "—";

function formatDate(value: string | null, locale: string): string {
  if (!value) return DASH;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return DASH;
  try {
    return d.toLocaleString(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function mapRow(r: Record<string, unknown>): RequestRow {
  const attachmentsRaw = Array.isArray(r.attachments) ? r.attachments : [];
  return {
    id: String(r.id ?? ""),
    userId: String(r.userId ?? r.user_id ?? ""),
    studentName: String(r.studentName ?? r.student_name ?? ""),
    studentEmail: String(r.studentEmail ?? r.student_email ?? ""),
    studentPhone: (r.studentPhone ?? r.student_phone) as string | null,
    studentWhatsapp: (r.studentWhatsapp ?? r.student_whatsapp) as string | null,
    courseTitle: String(r.courseTitle ?? r.course_title ?? ""),
    courseSubject: (r.courseSubject ?? r.course_subject) as string | null,
    courseDescription: String(r.courseDescription ?? r.course_description ?? ""),
    additionalNotes: (r.additionalNotes ?? r.additional_notes) as string | null,
    status: (r.status === "reviewed" ? "reviewed" : "pending") as "pending" | "reviewed",
    reviewedAt: r.reviewedAt != null ? String(r.reviewedAt) : r.reviewed_at != null ? String(r.reviewed_at) : null,
    reviewedByName: (r.reviewedByName ?? r.reviewed_by_name) as string | null,
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
    userName: String(r.userName ?? r.user_name ?? ""),
    userEmail: String(r.userEmail ?? r.user_email ?? ""),
    attachments: attachmentsRaw.map((a) => {
      const att = a as Record<string, unknown>;
      return {
        id: String(att.id ?? ""),
        fileUrl: String(att.fileUrl ?? att.file_url ?? ""),
        fileName: (att.fileName ?? att.file_name) as string | null,
        fileType: att.fileType === "pdf" || att.file_type === "pdf" ? "pdf" : "image",
      };
    }),
  };
}

export function CourseRequestsList({ initialRequests }: { initialRequests: RequestRow[] }) {
  const t = useT();
  const router = useRouter();
  const { locale, dir, thClassCompact } = useDashboardTable();
  const dateLocale = dateLocaleForUi(locale);

  const [requests, setRequests] = useState<RequestRow[]>(initialRequests);
  const [searchQuery, setSearchQuery] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);

  useEffect(() => setPortalMounted(true), []);

  useEffect(() => {
    if (!detailId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [detailId]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        r.courseTitle.toLowerCase().includes(q) ||
        r.userName.toLowerCase().includes(q),
    );
  }, [requests, searchQuery]);

  const detail = detailId ? requests.find((r) => r.id === detailId) ?? null : null;

  async function reload(search?: string) {
    setLoading(true);
    try {
      const url = search?.trim()
        ? `/api/dashboard/course-requests?search=${encodeURIComponent(search.trim())}`
        : "/api/dashboard/course-requests";
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json().catch(() => []);
      if (res.ok && Array.isArray(data)) {
        setRequests(data.map((r) => mapRow(r as Record<string, unknown>)));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(id: string) {
    setReviewingId(id);
    try {
      const res = await fetch(`/api/dashboard/course-requests/${encodeURIComponent(id)}/review`, {
        method: "PATCH",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? t(`${P}.reviewFailed`, "فشل تحديث حالة الطلب"));
        return;
      }
      router.refresh();
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "reviewed" as const, reviewedAt: new Date().toISOString() } : r,
        ),
      );
    } finally {
      setReviewingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t(`${P}.deleteConfirm`, "حذف هذا الطلب؟"))) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/dashboard/course-requests/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? t(`${P}.deleteFailed`, "فشل حذف الطلب"));
        return;
      }
      router.refresh();
      setRequests((prev) => prev.filter((r) => r.id !== id));
      if (detailId === id) setDetailId(null);
    } finally {
      setDeletingId(null);
    }
  }

  if (requests.length === 0) {
    return (
      <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-[var(--color-muted)]">
        {t(`${P}.empty`, "لا توجد طلبات حتى الآن.")}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t(`${P}.searchPlaceholder`, "بحث باسم الطالب أو الدورة...")}
          className="min-w-[220px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => reload(searchQuery)}
          disabled={loading}
          className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
        >
          {loading ? t(`${P}.searching`, "جاري البحث...") : t(`${P}.search`, "بحث")}
        </button>
        {searchQuery.trim() ? (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              reload();
            }}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
          >
            {t(`${P}.showAll`, "عرض الكل")}
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-[var(--color-muted)]">
          {t(`${P}.noSearchResults`, "لا توجد طلبات تطابق البحث.")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-sm" dir={dir}>
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/30">
                <th className={thClassCompact}>{t(`${P}.colDate`, "التاريخ")}</th>
                <th className={thClassCompact}>{t(`${P}.colStudent`, "الطالب")}</th>
                <th className={thClassCompact}>{t(`${P}.colCourse`, "الدورة المطلوبة")}</th>
                <th className={thClassCompact}>{t(`${P}.colSubject`, "المادة")}</th>
                <th className={thClassCompact}>{t(`${P}.colStatus`, "الحالة")}</th>
                <th className={thClassCompact}>{t(`${P}.colActions`, "إجراءات")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border)]">
                  <td className="p-2 text-[var(--color-muted)]">{formatDate(r.createdAt, dateLocale)}</td>
                  <td className="p-2 text-[var(--color-foreground)]">{r.studentName}</td>
                  <td className="p-2 text-[var(--color-foreground)]">{r.courseTitle}</td>
                  <td className="p-2 text-[var(--color-muted)]">{r.courseSubject?.trim() || DASH}</td>
                  <td className="p-2">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        r.status === "reviewed"
                          ? "bg-green-500/15 text-green-700"
                          : "bg-amber-500/15 text-amber-800"
                      }`}
                    >
                      {r.status === "reviewed"
                        ? t(`${P}.statusReviewed`, "تمت المراجعة")
                        : t(`${P}.statusPending`, "قيد الانتظار")}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailId(r.id)}
                        className="text-xs font-medium text-[var(--color-primary)] hover:underline"
                      >
                        {t(`${P}.viewDetails`, "التفاصيل")}
                      </button>
                      {r.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => handleReview(r.id)}
                          disabled={reviewingId === r.id}
                          className="text-xs font-medium text-green-700 hover:underline disabled:opacity-50"
                        >
                          {reviewingId === r.id
                            ? t(`${P}.reviewing`, "جاري...")
                            : t(`${P}.markReviewed`, "تعليم كمُراجع")}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        {deletingId === r.id ? t(`${P}.deleting`, "جاري الحذف...") : t(`${P}.delete`, "حذف")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && portalMounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
              role="dialog"
              aria-modal="true"
              onClick={() => setDetailId(null)}
            >
              <div
                className="max-h-[75vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xl sm:p-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-[var(--color-foreground)]">
                    {t(`${P}.detailTitle`, "تفاصيل الطلب")}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setDetailId(null)}
                    className="rounded p-1 text-[var(--color-muted)] hover:bg-[var(--color-border)]/40 hover:text-[var(--color-foreground)]"
                    aria-label={t(`${P}.close`, "إغلاق")}
                  >
                    ✕
                  </button>
                </div>

                <dl className="mt-3 space-y-2.5 text-sm">
                  <div>
                    <dt className="font-medium text-[var(--color-foreground)]">{t(`${P}.colDate`, "التاريخ")}</dt>
                    <dd className="text-[var(--color-muted)]">{formatDate(detail.createdAt, dateLocale)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-[var(--color-foreground)]">{t(`${P}.colStudent`, "الطالب")}</dt>
                    <dd className="text-[var(--color-muted)]">
                      {detail.studentName} — {detail.studentEmail}
                      <br />
                      {t(`${P}.phone`, "الهاتف")}: {detail.studentPhone ?? DASH} | {t(`${P}.whatsapp`, "واتساب")}:{" "}
                      {detail.studentWhatsapp ?? DASH}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-[var(--color-foreground)]">{t(`${P}.accountUser`, "حساب المنصة")}</dt>
                    <dd className="text-[var(--color-muted)]">
                      {detail.userName} ({detail.userEmail})
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-[var(--color-foreground)]">{t(`${P}.colCourse`, "الدورة المطلوبة")}</dt>
                    <dd className="text-[var(--color-muted)]">{detail.courseTitle}</dd>
                  </div>
                  {detail.courseSubject ? (
                    <div>
                      <dt className="font-medium text-[var(--color-foreground)]">{t(`${P}.colSubject`, "المادة")}</dt>
                      <dd className="text-[var(--color-muted)]">{detail.courseSubject}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="font-medium text-[var(--color-foreground)]">{t(`${P}.description`, "الوصف")}</dt>
                    <dd className="whitespace-pre-wrap text-[var(--color-muted)]">{detail.courseDescription}</dd>
                  </div>
                  {detail.additionalNotes ? (
                    <div>
                      <dt className="font-medium text-[var(--color-foreground)]">{t(`${P}.notes`, "ملاحظات")}</dt>
                      <dd className="whitespace-pre-wrap text-[var(--color-muted)]">{detail.additionalNotes}</dd>
                    </div>
                  ) : null}
                  {detail.status === "reviewed" ? (
                    <div>
                      <dt className="font-medium text-[var(--color-foreground)]">{t(`${P}.reviewedInfo`, "المراجعة")}</dt>
                      <dd className="text-[var(--color-muted)]">
                        {formatDate(detail.reviewedAt, dateLocale)}
                        {detail.reviewedByName ? ` — ${detail.reviewedByName}` : ""}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {detail.attachments.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-[var(--color-foreground)]">
                      {t(`${P}.attachments`, "المرفقات")} ({detail.attachments.length})
                    </p>
                    <ul className="mt-2 space-y-2">
                      {detail.attachments.map((att) => (
                        <li
                          key={att.id || att.fileUrl}
                          className="rounded-[var(--radius-btn)] border border-[var(--color-border)] p-2"
                        >
                          <a
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                          >
                            {att.fileName ?? att.fileUrl}
                          </a>
                          {att.fileType === "image" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={att.fileUrl}
                              alt={att.fileName ?? ""}
                              className="mt-2 max-h-32 w-auto rounded border border-[var(--color-border)] object-contain"
                            />
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {detail.status === "pending" ? (
                    <button
                      type="button"
                      onClick={() => handleReview(detail.id)}
                      disabled={reviewingId === detail.id}
                      className="rounded-[var(--radius-btn)] bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {reviewingId === detail.id
                        ? t(`${P}.reviewing`, "جاري...")
                        : t(`${P}.markReviewed`, "تعليم كمُراجع")}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleDelete(detail.id)}
                    disabled={deletingId === detail.id}
                    className="rounded-[var(--radius-btn)] border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-600 disabled:opacity-60"
                  >
                    {deletingId === detail.id ? t(`${P}.deleting`, "جاري الحذف...") : t(`${P}.delete`, "حذف")}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
