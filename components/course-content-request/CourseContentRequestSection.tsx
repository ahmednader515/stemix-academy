"use client";

import { useState } from "react";
import { useT } from "@/components/LocaleProvider";

type AttachmentItem = {
  fileUrl: string;
  fileName: string;
  fileType: "pdf" | "image";
};

type Props = {
  courseId: string;
  courseTitle: string;
};

export function CourseContentRequestSection({ courseId, courseTitle }: Props) {
  const t = useT();
  const C = "courses.contentRequest";
  const [description, setDescription] = useState("");
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
        const res = await fetch("/api/upload/course-content-request", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? t(`${C}.uploadFailed`, "فشل رفع الملف"));
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
      setError(t(`${C}.uploadFailed`, "فشل رفع الملف"));
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
    setSuccess(false);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}/content-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          description,
          attachments: attachments.map((a) => ({
            fileUrl: a.fileUrl,
            fileName: a.fileName,
            fileType: a.fileType,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t(`${C}.submitFailed`, "فشل إرسال الطلب"));
        return;
      }
      setDescription("");
      setAttachments([]);
      setSuccess(true);
    } catch {
      setError(t(`${C}.submitFailed`, "فشل إرسال الطلب"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] sm:p-5">
      <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
        {t(`${C}.title`, "طلب شرح محتوى جديد")}
      </h3>
      <p className="mt-1 text-xs text-[var(--color-muted)]">
        {t(`${C}.subtitle`, "ارفع محتوى يحتاج شرحاً وسيراجعه فريق الدورة.")} ({courseTitle})
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--color-foreground)]">
            {t(`${C}.descriptionLabel`, "اشرح ما تحتاج شرحه")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
            placeholder={t(`${C}.descriptionPlaceholder`, "صف المحتوى أو السؤال الذي تريد شرحه...")}
            className="mt-1 w-full resize-none rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
            disabled={submitting || uploading}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--color-foreground)]">
            {t(`${C}.filesLabel`, "المرفقات (PDF أو صورة)")}
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--color-border)]/30">
              {uploading
                ? t(`${C}.uploading`, "جاري الرفع...")
                : t(`${C}.addFile`, "إضافة ملف")}
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="sr-only"
                disabled={submitting || uploading}
                onChange={handleFileSelect}
              />
            </label>
          </div>
          {attachments.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {attachments.map((a, i) => (
                <li
                  key={`${a.fileUrl}-${i}`}
                  className="flex items-center justify-between rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                >
                  <span className="truncate">{a.fileName}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    {t(`${C}.remove`, "إزالة")}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? (
          <p className="text-sm text-green-700">
            {t(`${C}.success`, "تم إرسال طلبك بنجاح. سيتم مراجعته من فريق الدورة.")}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || uploading || !description.trim() || attachments.length === 0}
          className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
        >
          {submitting ? t(`${C}.submitting`, "جاري الإرسال...") : t(`${C}.submit`, "إرسال الطلب")}
        </button>
      </form>
    </section>
  );
}
