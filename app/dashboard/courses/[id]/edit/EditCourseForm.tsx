"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";
import { CourseFormSaveOverlay } from "../../CourseFormSaveOverlay";
import { CourseContentEditor } from "@/components/dashboard/CourseContentEditor";
import { serializeCourseContent, type ChapterState, type ContentItemState } from "@/lib/course-form-types";

type CollegeOption = { id: string; name: string; nameAr?: string | null };

type InitialData = {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  shortDescAr: string;
  shortDescEn: string;
  imageUrl: string;
  price: string;
  isPublished: boolean;
  maxQuizAttempts: number | null;
  categoryId: string;
  chapters: ChapterState[];
  courseLevelItems: ContentItemState[];
};

export function EditCourseForm({
  courseId,
  initialData,
  canManageColleges = false,
}: {
  courseId: string;
  initialData: InitialData;
  canManageColleges?: boolean;
}) {
  const router = useRouter();
  const t = useT();
  const Cf = "dashboard.courseForm";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [form, setForm] = useState({
    titleAr: initialData.titleAr,
    descriptionAr: initialData.descriptionAr,
    shortDescAr: initialData.shortDescAr,
    imageUrl: initialData.imageUrl,
    price: initialData.price,
    isPublished: initialData.isPublished,
    maxQuizAttempts: initialData.maxQuizAttempts != null ? String(initialData.maxQuizAttempts) : "",
    categoryId: initialData.categoryId ?? "",
  });
  const [chapters, setChapters] = useState<ChapterState[]>(initialData.chapters);
  const [courseLevelItems, setCourseLevelItems] = useState<ContentItemState[]>(initialData.courseLevelItems);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");

  useEffect(() => {
    fetch("/api/colleges", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const list = (data as { colleges?: CollegeOption[] }).colleges;
        if (Array.isArray(list)) setColleges(list);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.categoryId.trim()) {
      setError(t(`${Cf}.collegeRequired`));
      return;
    }
    setLoading(true);
    try {
      const contentPayload = serializeCourseContent(chapters, courseLevelItems);
      const payload = {
        titleAr: form.titleAr.trim(),
        titleEn: null,
        descriptionAr: form.descriptionAr.trim(),
        descriptionEn: null,
        shortDescAr: form.shortDescAr.trim() || undefined,
        shortDescEn: null,
        imageUrl: form.imageUrl.trim() || undefined,
        price: form.price ? parseFloat(form.price) : 0,
        isPublished: form.isPublished,
        maxQuizAttempts: form.maxQuizAttempts.trim() ? parseInt(form.maxQuizAttempts, 10) : null,
        categoryId: form.categoryId.trim(),
        ...contentPayload,
      };
      const res = await fetch(`/api/dashboard/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t(`${Cf}.saveEditFailed`));
        return;
      }
      router.push("/dashboard/courses");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-3xl space-y-8">
      <CourseFormSaveOverlay
        open={loading}
        title={t(`${Cf}.editingOverlayTitle`)}
        subtitle={t(`${Cf}.editingOverlaySubtitle`)}
      />
      {error && (
        <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">{t(`${Cf}.sectionCourseBasics`)}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{t(`${Cf}.courseImageLabel`)}</label>
            {form.imageUrl && (
              <div className="mt-2 flex items-start gap-2">
                <img src={form.imageUrl} alt="" className="h-24 w-40 rounded border object-cover" />
                <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))} className="text-sm text-red-600">
                  {t(`${Cf}.remove`)}
                </button>
              </div>
            )}
            <label className="mt-2 inline-block cursor-pointer rounded border px-4 py-2 text-sm">
              {imageUploading ? t(`${Cf}.uploadingImage`) : t(`${Cf}.chooseImageUpload`)}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={imageUploading}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setImageUploadError("");
                  setImageUploading(true);
                  try {
                    const fd = new FormData();
                    fd.set("file", f);
                    const res = await fetch("/api/upload/image", { method: "POST", body: fd });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok && data.url) setForm((prev) => ({ ...prev, imageUrl: data.url }));
                    else setImageUploadError(data.error ?? t(`${Cf}.uploadFailedDetail`));
                  } finally {
                    setImageUploading(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>
            {imageUploadError && <p className="mt-1 text-sm text-red-600">{imageUploadError}</p>}
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder={t(`${Cf}.imageUrlPlaceholder`)}
              className="mt-2 w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">{t(`${Cf}.collegeRequired`)}</label>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{t(`${Cf}.collegeHelp`)}</p>
            <select
              required
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="mt-1 w-full rounded border px-3 py-2"
            >
              <option value="">{t(`${Cf}.selectCollegeOption`)}</option>
              {colleges.map((col) => (
                <option key={col.id} value={col.id}>{col.nameAr ?? col.name}</option>
              ))}
            </select>
            {canManageColleges ? (
              <Link
                href="/dashboard/colleges"
                className="mt-2 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                {t(`${Cf}.manageCollegesLink`)}
              </Link>
            ) : null}
          </div>
          <div>
            <label className="block text-sm font-medium">{t(`${Cf}.priceEgpLabel`)}</label>
            <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} />
            <span className="text-sm">{t(`${Cf}.publishedCourseLabel`)}</span>
          </label>
          <div>
            <label className="block text-sm font-medium">{t(`${Cf}.titleArRequired`)}</label>
            <input type="text" value={form.titleAr} onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))} className="mt-1 w-full rounded border px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium">{t(`${Cf}.shortDescAr`)}</label>
            <input type="text" maxLength={300} value={form.shortDescAr} onChange={(e) => setForm((f) => ({ ...f, shortDescAr: e.target.value }))} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">{t(`${Cf}.fullDescArRequired`)}</label>
            <textarea value={form.descriptionAr} onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))} rows={4} className="mt-1 w-full rounded border px-3 py-2" required />
          </div>
        </div>
      </section>

      <CourseContentEditor
        chapters={chapters}
        setChapters={setChapters}
        courseLevelItems={courseLevelItems}
        setCourseLevelItems={setCourseLevelItems}
        maxQuizAttempts={form.maxQuizAttempts}
        onMaxQuizAttemptsChange={(v) => setForm((f) => ({ ...f, maxQuizAttempts: v }))}
      />

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="rounded bg-[var(--color-primary)] px-6 py-2 font-medium text-white disabled:opacity-50">
          {loading ? t(`${Cf}.savingEditBtnBusy`) : t(`${Cf}.savingEditBtnIdle`)}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded border px-6 py-2 font-medium">
          {t(`${Cf}.cancelBtnShort`)}
        </button>
      </div>
    </form>
  );
}
