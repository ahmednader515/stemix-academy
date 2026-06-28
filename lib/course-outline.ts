import type { CourseChapter, Lesson, Quiz } from "@/lib/types";

export type OutlineItem = {
  type: "lesson" | "quiz";
  data: Record<string, unknown>;
  order: number;
};

export type OutlineChapter = {
  chapter: Record<string, unknown> | null;
  items: OutlineItem[];
};

export type CourseOutline = {
  chapters: OutlineChapter[];
  orphans: OutlineItem[];
  flatItems: OutlineItem[];
};

function itemOrder(row: Record<string, unknown>, fallback: number): number {
  const o = row.order;
  return typeof o === "number" && Number.isFinite(o) ? o : fallback;
}

function chapterOrder(ch: Record<string, unknown>, fallback: number): number {
  const o = ch.order;
  return typeof o === "number" && Number.isFinite(o) ? o : fallback;
}

function chapterIdOf(row: Record<string, unknown>): string | null {
  const id = row.chapterId ?? row.chapter_id;
  return id != null && String(id).trim() !== "" ? String(id) : null;
}

export function buildCourseOutline(
  chapterRows: Record<string, unknown>[],
  lessonRows: Record<string, unknown>[],
  quizRows: Record<string, unknown>[]
): CourseOutline {
  const sortedChapters = [...chapterRows].sort(
    (a, b) => chapterOrder(a, 0) - chapterOrder(b, 0)
  );

  const allItems: OutlineItem[] = [
    ...lessonRows.map((l, i) => ({
      type: "lesson" as const,
      data: l,
      order: itemOrder(l, i),
    })),
    ...quizRows.map((q, i) => ({
      type: "quiz" as const,
      data: q,
      order: itemOrder(q, lessonRows.length + i),
    })),
  ].sort((a, b) => a.order - b.order);

  const byChapterId = new Map<string, OutlineItem[]>();
  const orphans: OutlineItem[] = [];

  for (const item of allItems) {
    const cid = chapterIdOf(item.data);
    if (!cid) {
      orphans.push(item);
      continue;
    }
    if (!byChapterId.has(cid)) byChapterId.set(cid, []);
    byChapterId.get(cid)!.push(item);
  }

  const chapters: OutlineChapter[] = sortedChapters.map((ch) => {
    const id = String(ch.id ?? "");
    return {
      chapter: ch,
      items: byChapterId.get(id) ?? [],
    };
  });

  for (const [cid, items] of byChapterId) {
    if (!sortedChapters.some((ch) => String(ch.id) === cid)) {
      orphans.push(...items);
    }
  }

  if (chapters.length === 0 && allItems.length > 0) {
    return {
      chapters: [{ chapter: null, items: allItems }],
      orphans: [],
      flatItems: allItems,
    };
  }

  return { chapters, orphans, flatItems: allItems };
}

export function pickLocalizedChapterTitle(ch: Record<string, unknown> | null): string {
  if (!ch) return "";
  const ar = ch.titleAr ?? ch.title_ar;
  const en = ch.title;
  if (ar != null && String(ar).trim()) return String(ar);
  if (en != null && String(en).trim()) return String(en);
  return "";
}

export function outlineItemTitle(item: OutlineItem): string {
  const d = item.data;
  const ar = d.titleAr ?? d.title_ar;
  const en = d.title;
  if (ar != null && String(ar).trim()) return String(ar);
  if (en != null && String(en).trim()) return String(en);
  return "";
}

export function outlineItemHref(
  course: { slug?: string | null; id: string },
  item: OutlineItem
): string {
  const seg =
    course.slug && String(course.slug).trim()
      ? encodeURIComponent(String(course.slug).trim().replace(/-+$/, "").replace(/^-+/, ""))
      : course.id;

  if (item.type === "lesson") {
    const slug = item.data.slug;
    const lessonSeg =
      slug && String(slug).trim() ? encodeURIComponent(String(slug).trim()) : String(item.data.id);
    return `/courses/${seg}/lessons/${lessonSeg}`;
  }
  return `/courses/${seg}/quizzes/${encodeURIComponent(String(item.data.id))}`;
}

export type { CourseChapter, Lesson, Quiz };
