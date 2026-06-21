import type { StaffFeedbackItem } from "@/lib/db";

export type StaffFeedbackRow = {
  id: string;
  type: "course" | "lesson";
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  courseTitleAr: string | null;
  lessonId?: string;
  lessonTitle?: string;
  lessonTitleAr?: string | null;
  rating: number;
  feedback: string | null;
  createdAt: string;
};

export function mapStaffFeedbackRow(item: StaffFeedbackItem): StaffFeedbackRow {
  return {
    id: item.id,
    type: item.type,
    studentName: item.studentName,
    studentEmail: item.studentEmail,
    courseId: item.courseId,
    courseTitle: item.courseTitle,
    courseTitleAr: item.courseTitleAr,
    lessonId: item.lessonId,
    lessonTitle: item.lessonTitle,
    lessonTitleAr: item.lessonTitleAr,
    rating: item.rating,
    feedback: item.feedback,
    createdAt: item.createdAt.toISOString(),
  };
}
