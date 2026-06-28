import Link from "next/link";
import { getServerTranslator } from "@/lib/i18n/server";
import {
  buildCourseOutline,
  outlineItemHref,
  outlineItemTitle,
  pickLocalizedChapterTitle,
} from "@/lib/course-outline";

function lessonHref(course: { slug?: string | null; id: string }, lesson: { slug?: string | null; id: string }): string {
  const seg =
    course.slug && course.slug.trim()
      ? encodeURIComponent(course.slug.trim().replace(/-+$/, "").replace(/^-+/, ""))
      : course.id;
  const lessonSeg = lesson.slug && lesson.slug.trim() ? encodeURIComponent(lesson.slug.trim()) : lesson.id;
  return `/courses/${seg}/lessons/${lessonSeg}`;
}

function quizHref(course: { slug?: string | null; id: string }, quizId: string): string {
  const seg =
    course.slug && course.slug.trim()
      ? encodeURIComponent(course.slug.trim().replace(/-+$/, "").replace(/^-+/, ""))
      : course.id;
  return `/courses/${seg}/quizzes/${encodeURIComponent(quizId)}`;
}

type Props = {
  course: { id: string; slug?: string | null };
  chapters: Record<string, unknown>[];
  lessons: Array<Record<string, unknown> & { id: string; title?: string; titleAr?: string | null; order?: number }>;
  quizzes: Array<Record<string, unknown> & { id: string; title?: string; order?: number; _count?: { questions?: number } }>;
  currentLessonId?: string | null;
  currentQuizId?: string | null;
};

export async function CourseOutlineSidebar({
  course,
  chapters,
  lessons,
  quizzes,
  currentLessonId,
  currentQuizId,
}: Props) {
  const t = await getServerTranslator();
  const outline = buildCourseOutline(chapters, lessons, quizzes);
  let globalIndex = 0;

  function renderLink(
    type: "lesson" | "quiz",
    data: Record<string, unknown>,
    isCurrent: boolean,
    displayIndex: number
  ) {
    const href =
      type === "lesson"
        ? lessonHref(course, data as { id: string; slug?: string | null })
        : quizHref(course, String(data.id));
    const title = outlineItemTitle({ type, data, order: 0 });
    const qCount =
      type === "quiz" ? Number((data as { _count?: { questions?: number } })._count?.questions ?? 0) : 0;

    return (
      <Link
        href={href}
        className={`block rounded-[var(--radius-btn)] px-2 py-1.5 text-xs transition ${
          isCurrent
            ? "bg-[var(--color-primary)]/15 font-medium text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30"
            : "text-[var(--color-foreground)] hover:bg-[var(--color-background)]"
        }`}
      >
        <span className="ml-1.5 text-[var(--color-muted)]">{displayIndex + 1}</span>
        {type === "quiz" && <span className="ml-1 text-[var(--color-muted)]">{t("courses.testPrefix", "Quiz:")}</span>}
        <span>{title}</span>
        {qCount > 0 && <span className="mr-0.5 text-[10px] text-[var(--color-muted)]">({qCount})</span>}
      </Link>
    );
  }

  return (
    <div className="sticky top-24 w-full max-w-[220px] rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)]">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {t("courses.courseContent", "Course content")}
      </h2>
      <div className="max-h-[70vh] space-y-3 overflow-y-auto">
        {outline.chapters.map((group, gi) => {
          if (group.items.length === 0) return null;
          const chapterTitle =
            pickLocalizedChapterTitle(group.chapter) ||
            t("courses.chapterN", "Chapter {n}").replace("{n}", String(gi + 1));
          return (
            <div key={group.chapter ? String(group.chapter.id) : `g-${gi}`}>
              <p className="mb-1 text-[10px] font-semibold uppercase text-[var(--color-muted)]">{chapterTitle}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const idx = globalIndex;
                  globalIndex += 1;
                  const isCurrent =
                    item.type === "lesson"
                      ? item.data.id === currentLessonId
                      : item.data.id === currentQuizId;
                  return (
                    <li key={`${item.type}-${String(item.data.id)}`}>
                      {renderLink(item.type, item.data, isCurrent, idx)}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        {outline.orphans.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase text-[var(--color-muted)]">
              {t("courses.orphanSection", "General content")}
            </p>
            <ul className="space-y-0.5">
              {outline.orphans.map((item) => {
                const idx = globalIndex;
                globalIndex += 1;
                const isCurrent =
                  item.type === "lesson"
                    ? item.data.id === currentLessonId
                    : item.data.id === currentQuizId;
                return (
                  <li key={`${item.type}-${String(item.data.id)}`}>
                    {renderLink(item.type, item.data, isCurrent, idx)}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
