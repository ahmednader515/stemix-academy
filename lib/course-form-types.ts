export type LessonRow = {
  title: string;
  videoUrl: string;
  content: string;
  pdfUrl: string;
  acceptsHomework: boolean;
};

export type QuestionOptionRow = { text: string; isCorrect: boolean };

export type QuestionRow = {
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  questionText: string;
  options: QuestionOptionRow[];
};

export type QuizRow = {
  title: string;
  timeLimitMinutes: string;
  questions: QuestionRow[];
};

export type ContentItemState =
  | { type: "lesson"; data: LessonRow }
  | { type: "quiz"; data: QuizRow };

export type ChapterState = {
  title: string;
  titleAr: string;
  items: ContentItemState[];
};

export type LessonPayload = {
  title: string;
  titleAr?: string;
  videoUrl?: string;
  content?: string;
  pdfUrl?: string;
  acceptsHomework?: boolean;
};

export type QuizPayload = {
  title: string;
  timeLimitMinutes?: number | null;
  questions: Array<{
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
    questionText: string;
    options?: { text: string; isCorrect: boolean }[];
  }>;
};

export type ContentItemPayload =
  | { type: "lesson"; lesson: LessonPayload }
  | { type: "quiz"; quiz: QuizPayload };

export type ChapterPayload = {
  title: string;
  titleAr?: string;
  items: ContentItemPayload[];
};

export type CourseContentPayload = {
  chapters?: ChapterPayload[];
  courseLevelItems?: ContentItemPayload[];
};

export const defaultLesson = (): LessonRow => ({
  title: "",
  videoUrl: "",
  content: "",
  pdfUrl: "",
  acceptsHomework: false,
});

export const defaultQuiz = (): QuizRow => ({
  title: "",
  timeLimitMinutes: "",
  questions: [{ type: "MULTIPLE_CHOICE", questionText: "", options: [{ text: "", isCorrect: false }] }],
});

export const defaultChapter = (): ChapterState => ({
  title: "",
  titleAr: "",
  items: [{ type: "lesson", data: defaultLesson() }],
});

export function serializeCourseContent(
  chapters: ChapterState[],
  courseLevelItems: ContentItemState[]
): CourseContentPayload {
  const mapLesson = (l: LessonRow): LessonPayload | null => {
    if (!l.title.trim()) return null;
    return {
      title: l.title.trim(),
      videoUrl: l.videoUrl.trim() || undefined,
      content: l.content.trim() || undefined,
      pdfUrl: l.pdfUrl.trim() || undefined,
      acceptsHomework: l.acceptsHomework,
    };
  };

  const mapQuiz = (q: QuizRow): QuizPayload | null => {
    if (!q.title.trim()) return null;
    const validQuestions = q.questions
      .filter((qt) => qt.questionText.trim())
      .map((qt) => ({
        type: qt.type,
        questionText: qt.questionText.trim(),
        options:
          qt.type === "TRUE_FALSE" || qt.type === "MULTIPLE_CHOICE"
            ? qt.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
            : undefined,
      }));
    if (validQuestions.length === 0) return null;
    const mins = q.timeLimitMinutes.trim() ? parseInt(q.timeLimitMinutes, 10) : null;
    return {
      title: q.title.trim(),
      timeLimitMinutes: mins != null && Number.isFinite(mins) && mins >= 1 ? mins : null,
      questions: validQuestions,
    };
  };

  const mapItems = (items: ContentItemState[]): ContentItemPayload[] => {
    const out: ContentItemPayload[] = [];
    for (const item of items) {
      if (item.type === "lesson") {
        const lesson = mapLesson(item.data);
        if (lesson) out.push({ type: "lesson", lesson });
      } else {
        const quiz = mapQuiz(item.data);
        if (quiz) out.push({ type: "quiz", quiz });
      }
    }
    return out;
  };

  return {
    chapters: chapters
      .map((ch) => ({
        title: ch.titleAr.trim() || ch.title.trim() || "فصل",
        titleAr: ch.titleAr.trim() || ch.title.trim() || undefined,
        items: mapItems(ch.items),
      }))
      .filter((ch) => ch.items.length > 0 || ch.titleAr || ch.title),
    courseLevelItems: mapItems(courseLevelItems),
  };
}
