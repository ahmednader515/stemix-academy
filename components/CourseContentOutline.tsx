import Link from "next/link";
import { getServerTranslator } from "@/lib/i18n/server";
import {
  buildCourseOutline,
  outlineItemHref,
  outlineItemTitle,
  pickLocalizedChapterTitle,
  type OutlineItem,
} from "@/lib/course-outline";

type Props = {
  course: { id: string; slug?: string | null };
  chapters: Record<string, unknown>[];
  lessons: Record<string, unknown>[];
  quizzes: Record<string, unknown>[];
  canAccessContent: boolean;
  canAccessQuizzes: boolean;
  allowedLessonIds?: string[];
  allowedQuizIds?: string[];
  hasPartialAccess?: boolean;
  isEnrolled?: boolean;
  isStaff?: boolean;
};

function filterItem(
  item: OutlineItem,
  opts: Pick<Props, "canAccessContent" | "canAccessQuizzes" | "allowedLessonIds" | "allowedQuizIds" | "hasPartialAccess" | "isEnrolled" | "isStaff">
): boolean {
  const { hasPartialAccess, isEnrolled, isStaff, allowedLessonIds = [], allowedQuizIds = [] } = opts;
  if (item.type === "lesson") {
    if (hasPartialAccess && !isEnrolled && !isStaff) {
      return allowedLessonIds.includes(String(item.data.id));
    }
    return opts.canAccessContent;
  }
  if (hasPartialAccess && !isEnrolled && !isStaff) {
    return allowedQuizIds.includes(String(item.data.id));
  }
  return opts.canAccessQuizzes;
}

function renderItem(
  item: OutlineItem,
  index: number,
  course: Props["course"],
  canLink: boolean,
  t: (k: string, fb?: string) => string
) {
  const href = outlineItemHref(course, item);
  const title = outlineItemTitle(item);
  const isQuiz = item.type === "quiz";
  const qCount = isQuiz ? Number((item.data as { _count?: { questions?: number } })._count?.questions ?? 0) : 0;

  const inner = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-sm font-medium text-[var(--color-primary)]">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <span className="font-medium text-[var(--color-foreground)]">{title}</span>
        {isQuiz && qCount > 0 && (
          <span className="mr-2 text-sm text-[var(--color-muted)]">
            • {qCount} {t("courses.questions", "questions")}
          </span>
        )}
        {!isQuiz && Boolean(item.data.videoUrl ?? item.data.video_url) && canLink && (
          <span className="mr-2 text-xs text-[var(--color-primary)]">▶ {t("courses.videoTag", "Video")}</span>
        )}
      </div>
    </>
  );

  const className = `flex items-center gap-3 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-3 ${canLink ? "transition hover:border-[var(--color-primary)]/30" : ""}`;

  return (
    <li key={`${item.type}-${String(item.data.id)}`}>
      {canLink ? (
        <Link href={href} className={className}>
          {inner}
        </Link>
      ) : (
        <div className={className}>{inner}</div>
      )}
    </li>
  );
}

export async function CourseContentOutline(props: Props) {
  const t = await getServerTranslator();
  const outline = buildCourseOutline(props.chapters, props.lessons, props.quizzes);
  const totalLessons = props.lessons.length;
  const totalChapters = props.chapters.length;

  let globalIndex = 0;

  return (
    <div className="mt-10 space-y-8">
      <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
        {t("courses.courseContent", "Course content")}
        {totalChapters > 0 && (
          <span className="mr-2 text-base font-normal text-[var(--color-muted)]">
            ({totalChapters} {t("courses.chapterCount", "chapters")} · {totalLessons} {t("courses.lessonsCount", "lessons")})
          </span>
        )}
      </h2>

      {outline.chapters.map((group, gi) => {
        const visibleItems = group.items.filter((item) => filterItem(item, props));
        if (visibleItems.length === 0) return null;
        const chapterTitle = pickLocalizedChapterTitle(group.chapter) || t("courses.chapterN", "Chapter {n}").replace("{n}", String(gi + 1));
        return (
          <div key={group.chapter ? String(group.chapter.id) : `g-${gi}`}>
            <h3 className="mb-3 text-lg font-semibold text-[var(--color-foreground)]">{chapterTitle}</h3>
            <ul className="space-y-2">
              {visibleItems.map((item) => {
                const idx = globalIndex;
                globalIndex += 1;
                const canLink =
                  item.type === "lesson"
                    ? props.canAccessContent && filterItem(item, props)
                    : props.canAccessQuizzes && filterItem(item, props);
                return renderItem(item, idx, props.course, canLink, t);
              })}
            </ul>
          </div>
        );
      })}

      {outline.orphans.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-[var(--color-foreground)]">
            {t("courses.orphanSection", "General content")}
          </h3>
          <ul className="space-y-2">
            {outline.orphans.filter((item) => filterItem(item, props)).map((item) => {
              const idx = globalIndex;
              globalIndex += 1;
              const canLink =
                item.type === "lesson"
                  ? props.canAccessContent
                  : props.canAccessQuizzes;
              return renderItem(item, idx, props.course, canLink, t);
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
