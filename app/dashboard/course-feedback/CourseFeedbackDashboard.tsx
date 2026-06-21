"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/components/LocaleProvider";
import { useDashboardTable, dateLocaleForUi } from "@/lib/i18n/dashboard-table";
import type { StaffFeedbackRow } from "@/lib/staff-feedback-rows";
import type { CourseContentRequestRow } from "@/lib/course-content-request-rows";

type Props = {
  initialFeedbacks: StaffFeedbackRow[];
  initialContentRequests: CourseContentRequestRow[];
};

const P = "dashboard.courseFeedbackPage";
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

export function CourseFeedbackDashboard({ initialFeedbacks, initialContentRequests }: Props) {
  const t = useT();
  const { locale, dir, thClassCompact } = useDashboardTable();
  const dateLocale = dateLocaleForUi(locale);

  const [tab, setTab] = useState<"feedbacks" | "content">("feedbacks");
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
  const [contentRequests, setContentRequests] = useState(initialContentRequests);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "reviewed">("");
  const [loading, setLoading] = useState(false);
  const [detailContentId, setDetailContentId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [portalMounted, setPortalMounted] = useState(false);

  useEffect(() => setPortalMounted(true), []);

  useEffect(() => {
    if (!detailContentId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [detailContentId]);

  const filteredFeedbacks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return feedbacks;
    return feedbacks.filter(
      (f) =>
        f.studentName.toLowerCase().includes(q) ||
        f.courseTitle.toLowerCase().includes(q) ||
        (f.lessonTitle ?? "").toLowerCase().includes(q) ||
        (f.feedback ?? "").toLowerCase().includes(q),
    );
  }, [feedbacks, search]);

  const filteredContent = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = contentRequests;
    if (statusFilter) list = list.filter((r) => r.status === statusFilter);
    if (!q) return list;
    return list.filter(
      (r) =>
        r.userName.toLowerCase().includes(q) ||
        r.courseTitle.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }, [contentRequests, search, statusFilter]);

  const detailContent = detailContentId
    ? contentRequests.find((r) => r.id === detailContentId) ?? null
    : null;

  async function reloadFeedbacks() {
    setLoading(true);
    try {
      const url = search.trim()
        ? `/api/dashboard/course-feedback?search=${encodeURIComponent(search.trim())}`
        : "/api/dashboard/course-feedback";
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json().catch(() => []);
      if (res.ok && Array.isArray(data)) setFeedbacks(data as StaffFeedbackRow[]);
    } finally {
      setLoading(false);
    }
  }

  async function reloadContent() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      const qs = params.toString();
      const res = await fetch(
        `/api/dashboard/course-content-requests${qs ? `?${qs}` : ""}`,
        { credentials: "include" },
      );
      const data = await res.json().catch(() => []);
      if (res.ok && Array.isArray(data)) setContentRequests(data as CourseContentRequestRow[]);
    } finally {
      setLoading(false);
    }
  }

  async function handleReviewContent(id: string) {
    setReviewingId(id);
    try {
      const res = await fetch(`/api/dashboard/course-content-requests/${encodeURIComponent(id)}/review`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) await reloadContent();
    } finally {
      setReviewingId(null);
    }
  }

  async function handleDeleteContent(id: string) {
    if (!confirm(t(`${P}.confirmDelete`, "هل تريد حذف هذا الطلب؟"))) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/dashboard/course-content-requests/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setDetailContentId(null);
        await reloadContent();
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("feedbacks")}
          className={`rounded-[var(--radius-btn)] px-4 py-2 text-sm font-medium ${
            tab === "feedbacks"
              ? "bg-[var(--color-primary)] text-white"
              : "border border-[var(--color-border)] bg-[var(--color-surface)]"
          }`}
        >
          {t(`${P}.tabFeedbacks`, "التقييمات والملاحظات")}
        </button>
        <button
          type="button"
          onClick={() => setTab("content")}
          className={`rounded-[var(--radius-btn)] px-4 py-2 text-sm font-medium ${
            tab === "content"
              ? "bg-[var(--color-primary)] text-white"
              : "border border-[var(--color-border)] bg-[var(--color-surface)]"
          }`}
        >
          {t(`${P}.tabContentRequests`, "طلبات شرح المحتوى")}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label className="block text-sm font-medium">{t(`${P}.searchLabel`, "بحث")}</label>
          <input
            type="text"
            dir={dir}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(`${P}.searchPlaceholder`, "اسم الطالب أو الدورة...")}
            className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
        </div>
        {tab === "content" ? (
          <div>
            <label className="block text-sm font-medium">{t(`${P}.statusFilter`, "الحالة")}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "" | "pending" | "reviewed")}
              className="mt-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            >
              <option value="">{t(`${P}.allStatuses`, "الكل")}</option>
              <option value="pending">{t(`${P}.statusPending`, "قيد المراجعة")}</option>
              <option value="reviewed">{t(`${P}.statusReviewed`, "تمت المراجعة")}</option>
            </select>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => (tab === "feedbacks" ? reloadFeedbacks() : reloadContent())}
          disabled={loading}
          className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {loading ? t(`${P}.loading`, "جاري التحميل...") : t(`${P}.refresh`, "تحديث")}
        </button>
      </div>

      {tab === "feedbacks" ? (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table dir={dir} className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/50">
                <th className={thClassCompact}>{t(`${P}.colType`, "النوع")}</th>
                <th className={thClassCompact}>{t(`${P}.colStudent`, "الطالب")}</th>
                <th className={thClassCompact}>{t(`${P}.colCourse`, "الدورة")}</th>
                <th className={thClassCompact}>{t(`${P}.colLesson`, "الحصة")}</th>
                <th className={thClassCompact}>{t(`${P}.colRating`, "التقييم")}</th>
                <th className={thClassCompact}>{t(`${P}.colFeedback`, "الملاحظة")}</th>
                <th className={thClassCompact}>{t(`${P}.colDate`, "التاريخ")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeedbacks.map((f) => (
                <tr key={`${f.type}-${f.id}`} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="p-3">
                    {f.type === "course"
                      ? t(`${P}.typeCourse`, "دورة")
                      : t(`${P}.typeLesson`, "حصة")}
                  </td>
                  <td className="p-3">{f.studentName}</td>
                  <td className="p-3">{f.courseTitleAr ?? f.courseTitle}</td>
                  <td className="p-3">{f.lessonTitleAr ?? f.lessonTitle ?? DASH}</td>
                  <td className="p-3">{f.rating}/5</td>
                  <td className="max-w-xs p-3 whitespace-pre-wrap">{f.feedback ?? DASH}</td>
                  <td className="p-3">{formatDate(f.createdAt, dateLocale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredFeedbacks.length === 0 ? (
            <p className="p-6 text-center text-[var(--color-muted)]">
              {t(`${P}.emptyFeedbacks`, "لا توجد تقييمات أو ملاحظات.")}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table dir={dir} className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/50">
                <th className={thClassCompact}>{t(`${P}.colStudent`, "الطالب")}</th>
                <th className={thClassCompact}>{t(`${P}.colCourse`, "الدورة")}</th>
                <th className={thClassCompact}>{t(`${P}.colDescription`, "الوصف")}</th>
                <th className={thClassCompact}>{t(`${P}.colStatus`, "الحالة")}</th>
                <th className={thClassCompact}>{t(`${P}.colDate`, "التاريخ")}</th>
                <th className={thClassCompact}>{t(`${P}.colActions`, "إجراءات")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredContent.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="p-3">{r.userName}</td>
                  <td className="p-3">{r.courseTitleAr ?? r.courseTitle}</td>
                  <td className="max-w-xs truncate p-3">{r.description}</td>
                  <td className="p-3">
                    {r.status === "reviewed"
                      ? t(`${P}.statusReviewed`, "تمت المراجعة")
                      : t(`${P}.statusPending`, "قيد المراجعة")}
                  </td>
                  <td className="p-3">{formatDate(r.createdAt, dateLocale)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailContentId(r.id)}
                        className="text-[var(--color-primary)] hover:underline"
                      >
                        {t(`${P}.view`, "عرض")}
                      </button>
                      {r.status === "pending" ? (
                        <button
                          type="button"
                          disabled={reviewingId === r.id}
                          onClick={() => handleReviewContent(r.id)}
                          className="text-green-700 hover:underline disabled:opacity-60"
                        >
                          {t(`${P}.markReviewed`, "تمت المراجعة")}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredContent.length === 0 ? (
            <p className="p-6 text-center text-[var(--color-muted)]">
              {t(`${P}.emptyContent`, "لا توجد طلبات شرح محتوى.")}
            </p>
          ) : null}
        </div>
      )}

      {portalMounted && detailContent
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
              <div
                dir={dir}
                className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg"
              >
                <h3 className="text-lg font-semibold">{t(`${P}.contentDetailTitle`, "تفاصيل الطلب")}</h3>
                <dl className="mt-4 space-y-2 text-sm">
                  <div>
                    <dt className="font-medium">{t(`${P}.colStudent`, "الطالب")}</dt>
                    <dd>{detailContent.userName}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">{t(`${P}.colCourse`, "الدورة")}</dt>
                    <dd>{detailContent.courseTitleAr ?? detailContent.courseTitle}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">{t(`${P}.colDescription`, "الوصف")}</dt>
                    <dd className="whitespace-pre-wrap">{detailContent.description}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">{t(`${P}.attachments`, "المرفقات")}</dt>
                    <dd className="mt-1 space-y-1">
                      {detailContent.attachments.map((a) => (
                        <a
                          key={a.id}
                          href={a.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[var(--color-primary)] hover:underline"
                        >
                          {a.fileName ?? (a.fileType === "pdf" ? "PDF" : "صورة")}
                        </a>
                      ))}
                    </dd>
                  </div>
                </dl>
                <div className="mt-6 flex flex-wrap gap-2">
                  {detailContent.status === "pending" ? (
                    <button
                      type="button"
                      disabled={reviewingId === detailContent.id}
                      onClick={() => handleReviewContent(detailContent.id)}
                      className="rounded-[var(--radius-btn)] bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {t(`${P}.markReviewed`, "تمت المراجعة")}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={deletingId === detailContent.id}
                    onClick={() => handleDeleteContent(detailContent.id)}
                    className="rounded-[var(--radius-btn)] border border-red-300 px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-60"
                  >
                    {t(`${P}.delete`, "حذف")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailContentId(null)}
                    className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
                  >
                    {t(`${P}.close`, "إغلاق")}
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
