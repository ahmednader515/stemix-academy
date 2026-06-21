"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";

type AttachmentItem = {
  fileUrl: string;
  fileName: string;
  fileType: "pdf" | "image";
};

type Props = {
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
  defaultWhatsapp: string;
};

const inputClass =
  "w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]";
const labelClass = "mb-1 block text-sm font-medium text-[var(--color-foreground)]";
const sectionClass =
  "rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]";

export function CourseRequestForm({
  defaultName,
  defaultEmail,
  defaultPhone,
  defaultWhatsapp,
}: Props) {
  const t = useT();
  const L = "dashboard.courseRequest";
  const router = useRouter();

  const [studentName, setStudentName] = useState(defaultName);
  const [studentEmail, setStudentEmail] = useState(defaultEmail);
  const [studentPhone, setStudentPhone] = useState(defaultPhone);
  const [studentWhatsapp, setStudentWhatsapp] = useState(defaultWhatsapp);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseSubject, setCourseSubject] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setError("");
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload/course-request", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? t(`${L}.uploadFailed`, "فشل رفع الملف"));
          break;
        }
        if (data.url) {
          setAttachments((prev) => [
            ...prev,
            {
              fileUrl: data.url,
              fileName: data.fileName ?? file.name,
              fileType: data.fileType === "pdf" ? "pdf" : "image",
            },
          ]);
        }
      }
    } catch {
      setError(t(`${L}.uploadFailed`, "فشل رفع الملف"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/course-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          studentName,
          studentEmail,
          studentPhone,
          studentWhatsapp,
          courseTitle,
          courseSubject,
          courseDescription,
          additionalNotes,
          attachments: attachments.map((a) => ({
            fileUrl: a.fileUrl,
            fileName: a.fileName,
            fileType: a.fileType,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t(`${L}.submitFailed`, "فشل إرسال الطلب"));
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError(t(`${L}.submitFailed`, "فشل إرسال الطلب"));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className={`${sectionClass} text-center`}>
        <p className="text-lg font-semibold text-[var(--color-primary)]">
          {t(`${L}.successTitle`, "تم إرسال طلبك بنجاح")}
        </p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {t(`${L}.successDesc`, "سيتم مراجعة طلبك والتواصل معك في أقرب وقت.")}
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
        >
          {t(`${L}.backToDashboard`, "العودة للوحة التحكم")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
          {t(`${L}.personalSectionTitle`, "البيانات الشخصية")}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t(`${L}.personalSectionDesc`, "تأكد من صحة بيانات التواصل حتى نتمكن من الرد عليك.")}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cr-name" className={labelClass}>
              {t(`${L}.nameLabel`, "الاسم")}
            </label>
            <input
              id="cr-name"
              type="text"
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cr-email" className={labelClass}>
              {t(`${L}.emailLabel`, "البريد الإلكتروني")}
            </label>
            <input
              id="cr-email"
              type="email"
              required
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cr-phone" className={labelClass}>
              {t(`${L}.phoneLabel`, "رقم الهاتف")}
            </label>
            <input
              id="cr-phone"
              type="tel"
              required
              inputMode="numeric"
              value={studentPhone}
              onChange={(e) => setStudentPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cr-whatsapp" className={labelClass}>
              {t(`${L}.whatsappLabel`, "رقم الواتساب")}
            </label>
            <input
              id="cr-whatsapp"
              type="tel"
              required
              inputMode="numeric"
              value={studentWhatsapp}
              onChange={(e) => setStudentWhatsapp(e.target.value)}
              placeholder="201012345678"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
          {t(`${L}.courseSectionTitle`, "تفاصيل الدورة المطلوبة")}
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="cr-course-title" className={labelClass}>
              {t(`${L}.courseTitleLabel`, "اسم الدورة")}
            </label>
            <input
              id="cr-course-title"
              type="text"
              required
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cr-course-subject" className={labelClass}>
              {t(`${L}.courseSubjectLabel`, "المادة / التخصص (اختياري)")}
            </label>
            <input
              id="cr-course-subject"
              type="text"
              value={courseSubject}
              onChange={(e) => setCourseSubject(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cr-course-desc" className={labelClass}>
              {t(`${L}.courseDescLabel`, "وصف الدورة")}
            </label>
            <textarea
              id="cr-course-desc"
              required
              rows={4}
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cr-notes" className={labelClass}>
              {t(`${L}.notesLabel`, "ملاحظات إضافية (اختياري)")}
            </label>
            <textarea
              id="cr-notes"
              rows={3}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
          {t(`${L}.attachmentsSectionTitle`, "مرفقات مرجعية (اختياري)")}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t(`${L}.attachmentsSectionDesc`, "يمكنك رفع صور أو ملفات PDF كمرجع للدورة المطلوبة.")}
        </p>
        <div className="mt-4">
          <label className="inline-flex cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-border)]/30">
            {uploading
              ? t(`${L}.uploading`, "جاري الرفع...")
              : t(`${L}.chooseFiles`, "اختر ملفات")}
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="sr-only"
              disabled={uploading || submitting}
              onChange={handleFileSelect}
            />
          </label>
        </div>
        {attachments.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {attachments.map((att, i) => (
              <li
                key={`${att.fileUrl}-${i}`}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate text-[var(--color-foreground)]">
                  {att.fileName}{" "}
                  <span className="text-[var(--color-muted)]">
                    ({att.fileType === "pdf" ? "PDF" : t(`${L}.imageType`, "صورة")})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="shrink-0 text-xs font-medium text-red-600 hover:underline"
                >
                  {t(`${L}.removeFile`, "إزالة")}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
        >
          {submitting ? t(`${L}.submitting`, "جاري الإرسال...") : t(`${L}.submitButton`, "إرسال الطلب")}
        </button>
        <Link
          href="/dashboard"
          className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-border)]/30"
        >
          {t(`${L}.cancelButton`, "إلغاء")}
        </Link>
      </div>
    </form>
  );
}
