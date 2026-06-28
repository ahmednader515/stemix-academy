"use client";

import { useState } from "react";
import { useT } from "@/components/LocaleProvider";
import type { ChapterState, ContentItemState, LessonRow, QuizRow } from "@/lib/course-form-types";
import { defaultChapter, defaultLesson, defaultQuiz } from "@/lib/course-form-types";

type Props = {
  chapters: ChapterState[];
  setChapters: React.Dispatch<React.SetStateAction<ChapterState[]>>;
  courseLevelItems: ContentItemState[];
  setCourseLevelItems: React.Dispatch<React.SetStateAction<ContentItemState[]>>;
  maxQuizAttempts: string;
  onMaxQuizAttemptsChange: (value: string) => void;
};

function updateItems(
  items: ContentItemState[],
  itemIndex: number,
  updater: (item: ContentItemState) => ContentItemState
): ContentItemState[] {
  return items.map((it, i) => (i === itemIndex ? updater(it) : it));
}

export function CourseContentEditor({
  chapters,
  setChapters,
  courseLevelItems,
  setCourseLevelItems,
  maxQuizAttempts,
  onMaxQuizAttemptsChange,
}: Props) {
  const t = useT();
  const Cf = "dashboard.courseForm";
  const [pdfUploading, setPdfUploading] = useState<string | null>(null);

  const tfPair = (): { text: string; isCorrect: boolean }[] => [
    { text: t(`${Cf}.trueOption`), isCorrect: true },
    { text: t(`${Cf}.falseOption`), isCorrect: false },
  ];

  function moveChapter(ci: number, dir: "up" | "down") {
    const to = dir === "up" ? ci - 1 : ci + 1;
    if (to < 0 || to >= chapters.length) return;
    setChapters((prev) => {
      const next = [...prev];
      [next[ci], next[to]] = [next[to], next[ci]];
      return next;
    });
  }

  function moveItem(items: ContentItemState[], from: number, dir: "up" | "down", setter: (items: ContentItemState[]) => void) {
    const to = dir === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[from], next[to]] = [next[to], next[from]];
    setter(next);
  }

  function renderLessonEditor(
    lesson: LessonRow,
    onChange: (lesson: LessonRow) => void,
    onRemove: () => void,
    canRemove: boolean,
    uploadKey: string
  ) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <input
            type="text"
            value={lesson.title}
            onChange={(e) => onChange({ ...lesson, title: e.target.value })}
            placeholder={t(`${Cf}.lessonTitlePlaceholder`)}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          />
          {canRemove && (
            <button type="button" onClick={onRemove} className="shrink-0 text-sm text-red-600 hover:underline">
              {t(`${Cf}.lessonDeleteBtn`)}
            </button>
          )}
        </div>
        <input
          type="url"
          value={lesson.videoUrl}
          onChange={(e) => onChange({ ...lesson, videoUrl: e.target.value })}
          placeholder={t(`${Cf}.youtubePlaceholder`)}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        />
        <textarea
          value={lesson.content}
          onChange={(e) => onChange({ ...lesson, content: e.target.value })}
          placeholder={t(`${Cf}.notesPlaceholder`)}
          rows={2}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={lesson.acceptsHomework}
            onChange={(e) => onChange({ ...lesson, acceptsHomework: e.target.checked })}
          />
          <span className="text-sm">{t(`${Cf}.homeworkCheckbox`)}</span>
        </label>
        {lesson.pdfUrl ? (
          <button type="button" onClick={() => onChange({ ...lesson, pdfUrl: "" })} className="text-sm text-red-600">
            {t(`${Cf}.remove`)} PDF
          </button>
        ) : (
          <label className="inline-block cursor-pointer rounded border px-3 py-1 text-sm">
            {pdfUploading === uploadKey ? t(`${Cf}.uploadingPdf`) : t(`${Cf}.choosePdfUpload`)}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setPdfUploading(uploadKey);
                try {
                  const fd = new FormData();
                  fd.set("file", f);
                  const res = await fetch("/api/upload/pdf", { method: "POST", body: fd });
                  const data = await res.json().catch(() => ({}));
                  if (res.ok && data.url) onChange({ ...lesson, pdfUrl: data.url });
                } finally {
                  setPdfUploading(null);
                  e.target.value = "";
                }
              }}
            />
          </label>
        )}
      </div>
    );
  }

  function renderQuizEditor(quiz: QuizRow, onChange: (quiz: QuizRow) => void, onRemove: () => void) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={quiz.title}
            onChange={(e) => onChange({ ...quiz, title: e.target.value })}
            placeholder={t(`${Cf}.quizTitlePlaceholder`)}
            className="flex-1 rounded border px-3 py-2 text-sm"
          />
          <button type="button" onClick={onRemove} className="text-sm text-red-600">
            {t(`${Cf}.deleteQuiz`)}
          </button>
        </div>
        <input
          type="number"
          min="1"
          placeholder={t(`${Cf}.openTimePlaceholderLine`)}
          value={quiz.timeLimitMinutes}
          onChange={(e) => onChange({ ...quiz, timeLimitMinutes: e.target.value })}
          className="w-full max-w-xs rounded border px-3 py-2 text-sm"
        />
        {quiz.questions.map((q, qti) => (
          <div key={qti} className="rounded border bg-[var(--color-surface)] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{t(`${Cf}.questionNPrefix`)}{qti + 1}</span>
              <select
                value={q.type}
                onChange={(e) => {
                  const type = e.target.value as "MULTIPLE_CHOICE" | "TRUE_FALSE";
                  onChange({
                    ...quiz,
                    questions: quiz.questions.map((qt, j) =>
                      j === qti
                        ? {
                            ...qt,
                            type,
                            options: type === "TRUE_FALSE" ? tfPair() : [{ text: "", isCorrect: false }],
                          }
                        : qt
                    ),
                  });
                }}
                className="rounded border px-2 py-1 text-sm"
              >
                <option value="MULTIPLE_CHOICE">{t(`${Cf}.mcqShort`)}</option>
                <option value="TRUE_FALSE">{t(`${Cf}.tfShort`)}</option>
              </select>
            </div>
            <textarea
              value={q.questionText}
              onChange={(e) =>
                onChange({
                  ...quiz,
                  questions: quiz.questions.map((qt, j) => (j === qti ? { ...qt, questionText: e.target.value } : qt)),
                })
              }
              placeholder={t(`${Cf}.questionTextPlaceholder`)}
              rows={2}
              className="mb-2 w-full rounded border px-2 py-1 text-sm"
            />
            {q.options.map((opt, oi) => (
              <div key={oi} className="mb-1 flex items-center gap-2">
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) =>
                    onChange({
                      ...quiz,
                      questions: quiz.questions.map((qt, j) =>
                        j === qti
                          ? { ...qt, options: qt.options.map((o, oi2) => (oi2 === oi ? { ...o, text: e.target.value } : o)) }
                          : qt
                      ),
                    })
                  }
                  className="flex-1 rounded border px-2 py-1 text-sm"
                />
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    checked={opt.isCorrect}
                    onChange={() =>
                      onChange({
                        ...quiz,
                        questions: quiz.questions.map((qt, j) =>
                          j === qti
                            ? { ...qt, options: qt.options.map((o, oi2) => ({ ...o, isCorrect: oi2 === oi })) }
                            : qt
                        ),
                      })
                    }
                  />
                  {t(`${Cf}.correctBadge`)}
                </label>
              </div>
            ))}
            {q.type === "MULTIPLE_CHOICE" && (
              <button
                type="button"
                className="text-sm text-[var(--color-primary)]"
                onClick={() =>
                  onChange({
                    ...quiz,
                    questions: quiz.questions.map((qt, j) =>
                      j === qti ? { ...qt, options: [...qt.options, { text: "", isCorrect: false }] } : qt
                    ),
                  })
                }
              >
                {t(`${Cf}.addOptionBtn`)}
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="text-sm text-[var(--color-primary)]"
          onClick={() =>
            onChange({
              ...quiz,
              questions: [...quiz.questions, { type: "MULTIPLE_CHOICE", questionText: "", options: [{ text: "", isCorrect: false }] }],
            })
          }
        >
          {t(`${Cf}.addQuestionBtn`)}
        </button>
      </div>
    );
  }

  function renderItemList(
    items: ContentItemState[],
    setItems: (items: ContentItemState[]) => void,
    keyPrefix: string
  ) {
    return (
      <ul className="space-y-4">
        {items.map((item, ii) => (
          <li key={`${keyPrefix}-${ii}`} className="rounded border bg-[var(--color-background)] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-muted)]">
                {item.type === "lesson" ? t(`${Cf}.lessonN`) : t(`${Cf}.orderQuizPrefix`)}
                {ii + 1}
              </span>
              <div className="flex gap-1">
                <button type="button" disabled={ii === 0} onClick={() => moveItem(items, ii, "up", setItems)} className="rounded border px-2 text-xs disabled:opacity-40">↑</button>
                <button type="button" disabled={ii === items.length - 1} onClick={() => moveItem(items, ii, "down", setItems)} className="rounded border px-2 text-xs disabled:opacity-40">↓</button>
                <button
                  type="button"
                  onClick={() => setItems(items.filter((_, j) => j !== ii))}
                  className="text-xs text-red-600"
                >
                  {t(`${Cf}.deleteBtn`)}
                </button>
              </div>
            </div>
            {item.type === "lesson"
              ? renderLessonEditor(
                  item.data,
                  (data) => setItems(updateItems(items, ii, () => ({ type: "lesson", data }))),
                  () => setItems(items.filter((_, j) => j !== ii)),
                  items.length > 1,
                  `${keyPrefix}-l-${ii}`
                )
              : renderQuizEditor(
                  item.data,
                  (data) => setItems(updateItems(items, ii, () => ({ type: "quiz", data }))),
                  () => setItems(items.filter((_, j) => j !== ii))
                )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-2 text-lg font-semibold">{t(`${Cf}.chaptersSection`)}</h3>
        <p className="mb-4 text-sm text-[var(--color-muted)]">{t(`${Cf}.chaptersSectionHelp`)}</p>
        <div className="mb-6">
          <label className="block text-sm font-medium">{t(`${Cf}.quizAttemptsHint`)}</label>
          <input
            type="number"
            min="1"
            placeholder={t(`${Cf}.unlimitedPlaceholderLine`)}
            value={maxQuizAttempts}
            onChange={(e) => onMaxQuizAttemptsChange(e.target.value)}
            className="mt-1 w-full max-w-xs rounded border px-3 py-2"
          />
        </div>
        {chapters.map((ch, ci) => (
          <div key={ci} className="mb-6 rounded border border-[var(--color-border)] p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={ch.titleAr}
                onChange={(e) =>
                  setChapters((prev) =>
                    prev.map((c, i) => (i === ci ? { ...c, titleAr: e.target.value, title: e.target.value } : c))
                  )
                }
                placeholder={t(`${Cf}.chapterTitlePlaceholder`)}
                className="min-w-[200px] flex-1 rounded border px-3 py-2 font-medium"
              />
              <button type="button" disabled={ci === 0} onClick={() => moveChapter(ci, "up")} className="rounded border px-2 text-xs disabled:opacity-40">{t(`${Cf}.moveUpTitle`)}</button>
              <button type="button" disabled={ci === chapters.length - 1} onClick={() => moveChapter(ci, "down")} className="rounded border px-2 text-xs disabled:opacity-40">{t(`${Cf}.moveDownTitle`)}</button>
              {chapters.length > 1 && (
                <button type="button" onClick={() => setChapters((prev) => prev.filter((_, i) => i !== ci))} className="text-sm text-red-600">
                  {t(`${Cf}.deleteChapter`)}
                </button>
              )}
            </div>
            {renderItemList(ch.items, (items) => setChapters((prev) => prev.map((c, i) => (i === ci ? { ...c, items } : c))), `ch-${ci}`)}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setChapters((prev) =>
                    prev.map((c, i) => (i === ci ? { ...c, items: [...c.items, { type: "lesson", data: defaultLesson() }] } : c))
                  )
                }
                className="rounded border px-3 py-1.5 text-sm"
              >
                {t(`${Cf}.addLessonBtn`)}
              </button>
              <button
                type="button"
                onClick={() =>
                  setChapters((prev) =>
                    prev.map((c, i) => (i === ci ? { ...c, items: [...c.items, { type: "quiz", data: defaultQuiz() }] } : c))
                  )
                }
                className="rounded border px-3 py-1.5 text-sm"
              >
                {t(`${Cf}.addQuizBtn`)}
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setChapters((prev) => [...prev, defaultChapter()])} className="rounded border px-4 py-2 text-sm font-medium">
          {t(`${Cf}.addChapter`)}
        </button>
      </section>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-2 text-lg font-semibold">{t(`${Cf}.courseLevelContent`)}</h3>
        <p className="mb-4 text-sm text-[var(--color-muted)]">{t(`${Cf}.courseLevelContentHelp`)}</p>
        {courseLevelItems.length > 0 ? renderItemList(courseLevelItems, setCourseLevelItems, "orphan") : (
          <p className="text-sm text-[var(--color-muted)]">{t(`${Cf}.noCourseLevelContent`)}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCourseLevelItems((prev) => [...prev, { type: "lesson", data: defaultLesson() }])}
            className="rounded border px-3 py-1.5 text-sm"
          >
            {t(`${Cf}.addLessonBtn`)}
          </button>
          <button
            type="button"
            onClick={() => setCourseLevelItems((prev) => [...prev, { type: "quiz", data: defaultQuiz() }])}
            className="rounded border px-3 py-1.5 text-sm"
          >
            {t(`${Cf}.addQuizBtn`)}
          </button>
        </div>
      </section>
    </>
  );
}
