import type { CourseRequestWithDetails } from "@/lib/db";

export type CourseRequestRow = {
  id: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string | null;
  studentWhatsapp: string | null;
  courseTitle: string;
  courseSubject: string | null;
  courseDescription: string;
  additionalNotes: string | null;
  status: "pending" | "reviewed";
  reviewedAt: string | null;
  reviewedByName: string | null;
  createdAt: string;
  userName: string;
  userEmail: string;
  attachments: Array<{
    id: string;
    fileUrl: string;
    fileName: string | null;
    fileType: "pdf" | "image";
  }>;
};

export function mapCourseRequestRow(r: CourseRequestWithDetails): CourseRequestRow {
  const rec = r as unknown as Record<string, unknown>;
  return {
    id: String(r.id),
    userId: String(rec.userId ?? rec.user_id ?? ""),
    studentName: String(rec.studentName ?? rec.student_name ?? ""),
    studentEmail: String(rec.studentEmail ?? rec.student_email ?? ""),
    studentPhone: (rec.studentPhone ?? rec.student_phone) as string | null,
    studentWhatsapp: (rec.studentWhatsapp ?? rec.student_whatsapp) as string | null,
    courseTitle: String(rec.courseTitle ?? rec.course_title ?? ""),
    courseSubject: (rec.courseSubject ?? rec.course_subject) as string | null,
    courseDescription: String(rec.courseDescription ?? rec.course_description ?? ""),
    additionalNotes: (rec.additionalNotes ?? rec.additional_notes) as string | null,
    status: (rec.status === "reviewed" ? "reviewed" : "pending") as "pending" | "reviewed",
    reviewedAt: rec.reviewedAt
      ? new Date(rec.reviewedAt as string | Date).toISOString()
      : rec.reviewed_at
        ? new Date(rec.reviewed_at as string | Date).toISOString()
        : null,
    reviewedByName: (r.reviewedByName ?? null) as string | null,
    createdAt: new Date((rec.createdAt ?? rec.created_at) as string | Date).toISOString(),
    userName: String(r.userName ?? ""),
    userEmail: String(r.userEmail ?? ""),
    attachments: (r.attachments ?? []).map((a) => {
      const att = a as unknown as Record<string, unknown>;
      return {
        id: String(a.id),
        fileUrl: String(att.fileUrl ?? att.file_url ?? ""),
        fileName: (att.fileName ?? att.file_name) as string | null,
        fileType: att.fileType === "pdf" || att.file_type === "pdf" ? "pdf" : "image",
      };
    }),
  };
}
