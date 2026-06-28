"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";
import { CourseFormSaveOverlay } from "../CourseFormSaveOverlay";
import { CourseContentEditor } from "@/components/dashboard/CourseContentEditor";
import { defaultChapter, serializeCourseContent, type ChapterState, type ContentItemState } from "@/lib/course-form-types";

type CollegeOption = { id: string; name: string; nameAr?: string | null };

export function CreateCourseForm({ canManageColleges = false }: { canManageColleges?: boolean }) {
  const router = useRouter();
  const t = useT();
  const Cf = "dashboard.courseForm";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [form, setForm] = useState({
    titleAr: "",
    descriptionAr: "",
    shortDescAr: "",
    imageUrl: "",
    price: "",
    isPublished: false,
    maxQuizAttempts: "",
    categoryId: "",
  });
  const [chapters, setChapters] = useState<ChapterState[]>([defaultChapter()]);
  const [courseLevelItems, setCourseLevelItems] = useState<ContentItemState[]>([]);
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

  function slugify(s: string) {
    return s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u0600-\u06FF-]+/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.categoryId.trim()) {
      setError(t(`${Cf}.collegeRequired`));
      return;
    }
    setLoading(true);
    try {
      const slug = slugify(form.titleAr || "course");
      const contentPayload = serializeCourseContent(chapters, courseLevelItems);
      const payload = {
        titleAr: form.titleAr.trim(),
        titleEn: null,
        slug,
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
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t(`${Cf}.createCourseFailed`));
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-3xl space-y-8">
      <CourseFormSaveOverlay
        open={loading}
        title={t(`${Cf}.creatingOverlayTitle`)}
        subtitle={t(`${Cf}.creatingOverlaySubtitle`)}
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
            <p className="mt-1 text-xs text-[var(--color-muted)]">{t(`${Cf}.courseImageHelp`)}</p>
            {form.imageUrl && (
              <div className="mt-2 flex items-start gap-2">
                <img
                  src={form.imageUrl}
                  alt={t(`${Cf}.previewAlt`)}
                  className="h-24 w-40 rounded-[var(--radius-btn)] border border-[var(--color-border)] object-cover"
                />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                  className="text-sm text-red-600 hover:underline"
                >
                  {t(`${Cf}.remove`)}
                </button>
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--color-border)]/50">
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
                      if (res.ok && data.url) {
                        setForm((prev) => ({ ...prev, imageUrl: data.url }));
                      } else {
                        const msg = data.missing?.length
                          ? `${data.error} ${data.missing.join(", ")}`
                          : (data.error || t(`${Cf}.uploadFailedDetail`));
                        setImageUploadError(msg);
                      }
                    } catch {
                      setImageUploadError(t(`${Cf}.connectionFailedUpload`));
                    } finally {
                      setImageUploading(false);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            </div>
            {imageUploadError && (
              <p className="mt-1 text-sm text-red-600">{imageUploadError}</p>
            )}
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => { setForm((f) => ({ ...f, imageUrl: e.target.value })); setImageUploadError(""); }}
              placeholder={t(`${Cf}.imageUrlPlaceholder`)}
              className="mt-2 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{t(`${Cf}.collegeRequired`)}</label>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{t(`${Cf}.collegeHelp`)}</p>
            <select
              required
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            >
              <option value="">{t(`${Cf}.selectCollegeOption`)}</option>
              {colleges.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.nameAr ?? col.name}
                </option>
              ))}
            </select>
            {colleges.length === 0 ? (
              <p className="mt-2 text-sm text-amber-700">{t(`${Cf}.noCollegesYet`)}</p>
            ) : null}
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
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{t(`${Cf}.priceEgpLabel`)}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="0"
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
            />
            <span className="text-sm text-[var(--color-foreground)]">{t(`${Cf}.publishedCourseLabel`)}</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{t(`${Cf}.titleArRequired`)}</label>
            <input
              type="text"
              value={form.titleAr}
              onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{t(`${Cf}.shortDescAr`)}</label>
            <input
              type="text"
              maxLength={300}
              value={form.shortDescAr}
              onChange={(e) => setForm((f) => ({ ...f, shortDescAr: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{t(`${Cf}.fullDescArRequired`)}</label>
            <textarea
              value={form.descriptionAr}
              onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))}
              rows={4}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              required
            />
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
        <button
          type="submit"
          disabled={loading}
          className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-6 py-2 font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {loading ? t(`${Cf}.savingCreateBtnBusy`) : t(`${Cf}.savingCreateCourseBtnIdle`)}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-6 py-2 font-medium">
          {t(`${Cf}.cancelBtnShort`)}
        </button>
      </div>
    </form>
  );
}
