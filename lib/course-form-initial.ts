import type { ChapterState, ContentItemState, LessonRow, QuizRow } from "@/lib/course-form-types";
import { defaultChapter, defaultLesson, defaultQuiz } from "@/lib/course-form-types";
import { buildCourseOutline } from "@/lib/course-outline";

type InitialQuestion = {
  type: "MULTIPLE_CHOICE" | "ESSAY" | "TRUE_FALSE";
  questionText: string;
  options?: { text: string; isCorrect: boolean }[];
};

function rowToLesson(row: Record<string, unknown>): LessonRow {
  return {
    title: String(row.title ?? ""),
    videoUrl: String(row.videoUrl ?? row.video_url ?? ""),
    content: String(row.content ?? ""),
    pdfUrl: String(row.pdfUrl ?? row.pdf_url ?? ""),
    acceptsHomework: Boolean(row.acceptsHomework ?? row.accepts_homework ?? false),
  };
}

function rowToQuiz(
  row: Record<string, unknown>,
  tfPair: () => { text: string; isCorrect: boolean }[]
): QuizRow {
  const rawLimit = row.timeLimitMinutes ?? row.time_limit_minutes;
  const timeLimitMinutes =
    typeof rawLimit === "number" && Number.isFinite(rawLimit) && rawLimit >= 1
      ? String(rawLimit)
      : typeof rawLimit === "string" && rawLimit.trim() !== ""
        ? rawLimit
        : "";
  const questions = (row.questions ?? []) as InitialQuestion[];
  return {
    title: String(row.title ?? ""),
    timeLimitMinutes,
    questions:
      questions.length > 0
        ? questions.map((qt) => {
            const type = qt.type === "ESSAY" ? ("MULTIPLE_CHOICE" as const) : qt.type;
            const options =
              qt.type === "TRUE_FALSE"
                ? qt.options?.length
                  ? qt.options
                  : tfPair()
                : qt.options?.length
                  ? qt.options
                  : [{ text: "", isCorrect: false }];
            return { type, questionText: qt.questionText, options };
          })
        : defaultQuiz().questions,
  };
}

export function buildInitialCourseContentState(
  chapterRows: Record<string, unknown>[],
  lessonRows: Record<string, unknown>[],
  quizRows: Record<string, unknown>[],
  tfPair: () => { text: string; isCorrect: boolean }[]
): { chapters: ChapterState[]; courseLevelItems: ContentItemState[] } {
  const outline = buildCourseOutline(chapterRows, lessonRows, quizRows);

  const mapItem = (item: { type: "lesson" | "quiz"; data: Record<string, unknown> }): ContentItemState => {
    if (item.type === "lesson") {
      return { type: "lesson", data: rowToLesson(item.data) };
    }
    return { type: "quiz", data: rowToQuiz(item.data, tfPair) };
  };

  if (outline.chapters.length === 0 && outline.orphans.length === 0) {
    return {
      chapters: [defaultChapter()],
      courseLevelItems: [],
    };
  }

  const chapters: ChapterState[] = outline.chapters
    .filter((g) => g.chapter != null)
    .map((g) => {
      const ch = g.chapter!;
      const titleAr = String(ch.titleAr ?? ch.title_ar ?? ch.title ?? "");
      return {
        title: titleAr,
        titleAr,
        items: g.items.length > 0 ? g.items.map(mapItem) : [{ type: "lesson", data: defaultLesson() }],
      };
    });

  const orphans = outline.orphans.map(mapItem);

  if (chapters.length === 0 && outline.chapters.length === 1 && outline.chapters[0].chapter == null) {
    const items = outline.chapters[0].items.map(mapItem);
    return {
      chapters: items.length > 0 ? [{ title: "الفصل الأول", titleAr: "الفصل الأول", items }] : [defaultChapter()],
      courseLevelItems: [],
    };
  }

  if (chapters.length === 0) {
    return { chapters: [defaultChapter()], courseLevelItems: orphans };
  }

  return { chapters, courseLevelItems: orphans };
}
