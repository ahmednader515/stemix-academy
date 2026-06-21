"use client";

import { useState } from "react";
import { useT } from "@/components/LocaleProvider";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { CourseChatPanel } from "@/components/course-chat/CourseChatPanel";
import { dateLocaleForUi } from "@/lib/i18n/dashboard-table";

type CourseRow = {
  courseId: string;
  courseTitle: string;
  courseTitleAr: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  messageCount: number;
};

type PrivateRow = {
  conversationId: string;
  courseId: string;
  courseTitle: string;
  courseTitleAr: string | null;
  studentName: string;
  updatedAt: string;
  lastMessagePreview: string | null;
};

type Props = {
  initialCourses: CourseRow[];
  initialPrivateThreads: PrivateRow[];
  userId: string;
  userName: string;
  userRole: string;
};

export function CourseChatsList({
  initialCourses,
  initialPrivateThreads,
  userId,
  userName,
  userRole,
}: Props) {
  const t = useT();
  const P = "dashboard.courseChatsPage";
  const dateLocale = dateLocaleForUi();
  const [tab, setTab] = useState<"group" | "private">("group");
  const [selectedCourse, setSelectedCourse] = useState<CourseRow | null>(null);
  const [selectedPrivate, setSelectedPrivate] = useState<PrivateRow | null>(null);

  function courseLabel(c: { courseTitle: string; courseTitleAr: string | null }) {
    return pickLocalizedText(c.courseTitleAr, c.courseTitle) || c.courseTitle;
  }

  if (selectedCourse) {
    return (
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setSelectedCourse(null)}
          className="mb-4 text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {t(`${P}.backToList`, "← العودة للقائمة")}
        </button>
        <CourseChatPanel
          courseId={selectedCourse.courseId}
          courseTitle={courseLabel(selectedCourse)}
          creatorId={null}
          creatorRole={null}
          userRole={userRole}
          userId={userId}
          userName={userName}
          groupOnly
        />
      </div>
    );
  }

  if (selectedPrivate) {
    return (
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setSelectedPrivate(null)}
          className="mb-4 text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {t(`${P}.backToList`, "← العودة للقائمة")}
        </button>
        <p className="mb-2 text-sm text-[var(--color-muted)]">
          {t(`${P}.privateWith`, "محادثة خاصة مع")} {selectedPrivate.studentName} — {courseLabel(selectedPrivate)}
        </p>
        <CourseChatPanel
          courseId={selectedPrivate.courseId}
          courseTitle={courseLabel(selectedPrivate)}
          creatorId={userId}
          creatorRole={userRole}
          userRole={userRole}
          userId={userId}
          userName={userName}
          privateConversationId={selectedPrivate.conversationId}
          defaultTab="private"
        />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex rounded-[var(--radius-btn)] border border-[var(--color-border)] p-0.5 w-fit">
        <button
          type="button"
          onClick={() => setTab("group")}
          className={`rounded-[var(--radius-btn)] px-4 py-2 text-sm font-medium ${
            tab === "group" ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-muted)]"
          }`}
        >
          {t(`${P}.tabGroupRooms`, "غرف الدورات")}
        </button>
        <button
          type="button"
          onClick={() => setTab("private")}
          className={`rounded-[var(--radius-btn)] px-4 py-2 text-sm font-medium ${
            tab === "private" ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-muted)]"
          }`}
        >
          {t(`${P}.tabPrivate`, "أسئلة خاصة")}
        </button>
      </div>

      {tab === "group" ? (
        initialCourses.length === 0 ? (
          <p className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-[var(--color-muted)]">
            {t(`${P}.noCourses`, "لا توجد دورات.")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/30">
                  <th className="p-3 text-start font-semibold">{t(`${P}.colCourse`, "الدورة")}</th>
                  <th className="p-3 text-start font-semibold">{t(`${P}.colLastMessage`, "آخر رسالة")}</th>
                  <th className="p-3 text-start font-semibold">{t(`${P}.colCount`, "العدد")}</th>
                  <th className="p-3 text-start font-semibold">{t(`${P}.colAction`, "إجراء")}</th>
                </tr>
              </thead>
              <tbody>
                {initialCourses.map((c) => (
                  <tr key={c.courseId} className="border-b border-[var(--color-border)]">
                    <td className="p-3 font-medium">{courseLabel(c)}</td>
                    <td className="p-3 text-[var(--color-muted)]">
                      {c.lastMessagePreview ?? "—"}
                      {c.lastMessageAt ? (
                        <span className="mt-0.5 block text-xs">
                          {new Date(c.lastMessageAt).toLocaleString(dateLocale)}
                        </span>
                      ) : null}
                    </td>
                    <td className="p-3">{c.messageCount}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => setSelectedCourse(c)}
                        className="text-[var(--color-primary)] hover:underline"
                      >
                        {t(`${P}.openChat`, "فتح المحادثة")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : initialPrivateThreads.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-[var(--color-muted)]">
          {t(`${P}.noPrivate`, "لا توجد محادثات خاصة بعد.")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/30">
                <th className="p-3 text-start font-semibold">{t(`${P}.colStudent`, "الطالب")}</th>
                <th className="p-3 text-start font-semibold">{t(`${P}.colCourse`, "الدورة")}</th>
                <th className="p-3 text-start font-semibold">{t(`${P}.colLastMessage`, "آخر رسالة")}</th>
                <th className="p-3 text-start font-semibold">{t(`${P}.colAction`, "إجراء")}</th>
              </tr>
            </thead>
            <tbody>
              {initialPrivateThreads.map((row) => (
                <tr key={row.conversationId} className="border-b border-[var(--color-border)]">
                  <td className="p-3 font-medium">{row.studentName}</td>
                  <td className="p-3">{courseLabel(row)}</td>
                  <td className="p-3 text-[var(--color-muted)]">
                    {row.lastMessagePreview ?? "—"}
                    <span className="mt-0.5 block text-xs">
                      {new Date(row.updatedAt).toLocaleString(dateLocale)}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPrivate(row)}
                      className="text-[var(--color-primary)] hover:underline"
                    >
                      {t(`${P}.reply`, "رد")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
