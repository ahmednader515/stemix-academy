import type { Session } from "next-auth";
import type { UserRole, CoursePrivateConversation } from "@/lib/types";
import {
  getCourseById,
  getEnrollment,
  getAllowedLessonIdsForUserCourse,
  hasFullCourseAccessAsStudent,
} from "@/lib/db";

export type CourseChatAccessContext = {
  courseId: string;
  createdById: string | null;
  userId: string;
  role: UserRole;
  canAccessCourse: boolean;
  canGroupChat: boolean;
  canPrivateChatStudent: boolean;
  canPrivateChatStaff: boolean;
};

export async function getCourseChatAccess(
  courseId: string,
  session: Session | null,
): Promise<CourseChatAccessContext | null> {
  if (!session?.user?.id) return null;
  const course = await getCourseById(courseId);
  if (!course) return null;

  const role = session.user.role as UserRole;
  const userId = session.user.id;
  const courseRow = course as { createdById?: string | null; created_by_id?: string | null };
  const createdById = courseRow.createdById ?? courseRow.created_by_id ?? null;

  const isStaff = role === "ADMIN" || role === "ASSISTANT_ADMIN";
  const isTeacher = role === "TEACHER";
  const isStudent = role === "STUDENT";

  let canAccessCourse = false;
  if (isStaff) {
    canAccessCourse = true;
  } else if (isTeacher) {
    canAccessCourse = createdById === userId;
  } else if (isStudent) {
    const enrolled = await getEnrollment(userId, courseId);
    const fullAccess = await hasFullCourseAccessAsStudent(userId, courseId);
    const allowedLessons = enrolled || fullAccess ? [] : await getAllowedLessonIdsForUserCourse(userId, courseId);
    canAccessCourse = !!enrolled || fullAccess || allowedLessons.length > 0;
  }

  const canGroupChat =
    canAccessCourse &&
    (isStaff || isTeacher || isStudent);

  const canPrivateChatStudent = isStudent && canAccessCourse && !!createdById;
  const canPrivateChatStaff = !!createdById && userId === createdById;

  return {
    courseId,
    createdById,
    userId,
    role,
    canAccessCourse,
    canGroupChat,
    canPrivateChatStudent,
    canPrivateChatStaff,
  };
}

export function canStaffAccessGroupChat(
  role: UserRole,
  userId: string,
  createdById: string | null,
): boolean {
  if (role === "ADMIN" || role === "ASSISTANT_ADMIN") return true;
  if (role === "TEACHER") return createdById === userId;
  return false;
}

export function canAccessPrivateConversation(
  role: UserRole,
  userId: string,
  conv: CoursePrivateConversation,
): boolean {
  if (role === "STUDENT") return conv.student_user_id === userId;
  return conv.staff_user_id === userId;
}

export type SerializedChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  messageType: "text" | "image" | "file";
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
};

export function serializeGroupMessage(msg: {
  id: string;
  sender_id?: string;
  senderId?: string;
  senderName?: string;
  message_type?: string;
  messageType?: string;
  content?: string | null;
  file_url?: string | null;
  fileUrl?: string | null;
  file_name?: string | null;
  fileName?: string | null;
  created_at?: Date | string;
  createdAt?: Date | string;
}): SerializedChatMessage {
  const rec = msg as Record<string, unknown>;
  return {
    id: String(msg.id),
    senderId: String(rec.senderId ?? rec.sender_id ?? ""),
    senderName: String(msg.senderName ?? ""),
    messageType: (rec.messageType ?? rec.message_type ?? "text") as "text" | "image" | "file",
    content: (rec.content as string | null) ?? null,
    fileUrl: (rec.fileUrl ?? rec.file_url) as string | null,
    fileName: (rec.fileName ?? rec.file_name) as string | null,
    createdAt: new Date((rec.createdAt ?? rec.created_at) as string | Date).toISOString(),
  };
}

export function serializePrivateMessage(msg: Parameters<typeof serializeGroupMessage>[0]): SerializedChatMessage {
  return serializeGroupMessage(msg);
}

export function studentNameOnly(name: string): { name: string } {
  return { name: name.trim() || "—" };
}
