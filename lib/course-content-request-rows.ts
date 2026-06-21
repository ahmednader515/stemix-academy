import type { CourseContentRequestWithDetails } from "@/lib/db";

export type CourseContentRequestRow = {
  id: string;
  courseId: string;
  userId: string;
  description: string;
  status: "pending" | "reviewed";
  reviewedAt: string | null;
  reviewedByName: string | null;
  createdAt: string;
  userName: string;
  userEmail: string;
  courseTitle: string;
  courseTitleAr: string | null;
  attachments: Array<{
    id: string;
    fileUrl: string;
    fileName: string | null;
    fileType: "pdf" | "image";
  }>;
};

export function mapCourseContentRequestRow(r: CourseContentRequestWithDetails): CourseContentRequestRow {
  const rec = r as unknown as Record<string, unknown>;
  return {
    id: String(r.id),
    courseId: String(rec.courseId ?? rec.course_id ?? ""),
    userId: String(rec.userId ?? rec.user_id ?? ""),
    description: String(rec.description ?? ""),
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
    courseTitle: String(r.courseTitle ?? ""),
    courseTitleAr: (r.courseTitleAr ?? null) as string | null,
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
