import type { ContentItemPayload, CourseContentPayload, QuizPayload } from "@/lib/course-form-types";
import {
  createChapter,
  createLesson,
  createQuiz,
  createQuestion,
  createQuestionOption,
  deleteChaptersByCourseId,
  deleteLessonsByCourseId,
  deleteQuizzesByCourseId,
} from "@/lib/db";

type QuestionInput = {
  type: "MULTIPLE_CHOICE" | "ESSAY" | "TRUE_FALSE";
  questionText: string;
  options?: { text: string; isCorrect: boolean }[];
};

async function persistQuiz(
  courseId: string,
  chapterId: string | null,
  quizPayload: { title: string; timeLimitMinutes?: number | null; questions: QuestionInput[] },
  order: number
) {
  const mins = quizPayload.timeLimitMinutes;
  const timeLimitMinutes =
    typeof mins === "number" && Number.isFinite(mins) && mins >= 1 ? mins : null;
  const quiz = await createQuiz({
    course_id: courseId,
    title: quizPayload.title?.trim() || "اختبار",
    order,
    time_limit_minutes: timeLimitMinutes,
    chapter_id: chapterId,
  });
  const questions = quizPayload.questions ?? [];
  for (let qti = 0; qti < questions.length; qti++) {
    const qt = questions[qti];
    const qType =
      qt.type === "ESSAY" ? "ESSAY" : qt.type === "TRUE_FALSE" ? "TRUE_FALSE" : "MULTIPLE_CHOICE";
    const question = await createQuestion({
      quiz_id: quiz.id,
      type: qType,
      question_text: qt.questionText?.trim() || "",
      order: qti + 1,
    });
    if ((qt.type === "MULTIPLE_CHOICE" || qt.type === "TRUE_FALSE") && Array.isArray(qt.options)) {
      for (const opt of qt.options) {
        await createQuestionOption({
          question_id: question.id,
          text: opt.text?.trim() || "",
          is_correct: !!opt.isCorrect,
        });
      }
    }
  }
}

async function persistLesson(
  courseId: string,
  chapterId: string | null,
  le: {
    title: string;
    titleAr?: string;
    videoUrl?: string;
    content?: string;
    pdfUrl?: string;
    acceptsHomework?: boolean;
  },
  slug: string,
  order: number
) {
  await createLesson({
    course_id: courseId,
    title: le.title?.trim() || "حصة",
    title_ar: le.titleAr?.trim() || null,
    slug,
    content: le.content?.trim() || null,
    video_url: le.videoUrl?.trim() || null,
    pdf_url: le.pdfUrl?.trim() || null,
    order,
    accepts_homework: !!le.acceptsHomework,
    chapter_id: chapterId,
  });
}

async function persistItems(
  courseId: string,
  slug: string,
  chapterId: string | null,
  items: ContentItemPayload[],
  startOrder: number
): Promise<number> {
  let order = startOrder;
  let lessonIdx = 0;
  for (const item of items) {
    if (item.type === "lesson") {
      lessonIdx += 1;
      const lessonSlug = `${slug}-${chapterId ? `${chapterId.slice(-6)}-` : "o-"}l${lessonIdx}`.replace(/\s+/g, "-");
      await persistLesson(courseId, chapterId, item.lesson, lessonSlug, order);
    } else {
      await persistQuiz(courseId, chapterId, item.quiz, order);
    }
    order += 1;
  }
  return order;
}

type LegacyPayload = {
  lessons?: Array<{
    title: string;
    titleAr?: string;
    videoUrl?: string;
    content?: string;
    pdfUrl?: string;
    acceptsHomework?: boolean;
  }>;
  quizzes?: Array<{
    title: string;
    timeLimitMinutes?: number | null;
    questions: QuestionInput[];
  }>;
  contentOrder?: Array<{ type: "lesson"; index: number } | { type: "quiz"; index: number }>;
};

function isNewPayload(body: CourseContentPayload & LegacyPayload): boolean {
  return Array.isArray(body.chapters) || Array.isArray(body.courseLevelItems);
}

function legacyToOrderedItems(body: LegacyPayload): ContentItemPayload[] {
  const lessons = body.lessons ?? [];
  const quizzes = body.quizzes ?? [];
  const contentOrder =
    body.contentOrder ??
    ([
      ...lessons.map((_, i) => ({ type: "lesson" as const, index: i })),
      ...quizzes.map((_, i) => ({ type: "quiz" as const, index: i })),
    ] as Array<{ type: "lesson"; index: number } | { type: "quiz"; index: number }>);

  const items: ContentItemPayload[] = [];
  for (const entry of contentOrder) {
    if (entry.type === "lesson" && lessons[entry.index]) {
      items.push({ type: "lesson", lesson: lessons[entry.index] });
    } else if (entry.type === "quiz" && quizzes[entry.index]) {
      items.push({ type: "quiz", quiz: quizzes[entry.index] as QuizPayload & { questions: QuestionInput[] } });
    }
  }
  return items;
}

export async function saveCourseContentFromPayload(
  courseId: string,
  slug: string,
  body: CourseContentPayload & LegacyPayload
): Promise<void> {
  await deleteLessonsByCourseId(courseId);
  await deleteQuizzesByCourseId(courseId);
  await deleteChaptersByCourseId(courseId);

  let globalOrder = 0;

  if (isNewPayload(body)) {
    const chapters = body.chapters ?? [];
    for (let ci = 0; ci < chapters.length; ci++) {
      const ch = chapters[ci];
      const titleAr = ch.titleAr?.trim() || ch.title?.trim() || `فصل ${ci + 1}`;
      const chapter = await createChapter({
        course_id: courseId,
        title: titleAr,
        title_ar: titleAr,
        order: ci,
      });
      globalOrder = await persistItems(courseId, slug, chapter.id, ch.items ?? [], globalOrder);
    }
    await persistItems(courseId, slug, null, body.courseLevelItems ?? [], globalOrder);
    return;
  }

  const items = legacyToOrderedItems(body);
  if (items.length === 0) return;

  const chapter = await createChapter({
    course_id: courseId,
    title: "الفصل الأول",
    title_ar: "الفصل الأول",
    order: 0,
  });
  await persistItems(courseId, slug, chapter.id, items, 0);
}
