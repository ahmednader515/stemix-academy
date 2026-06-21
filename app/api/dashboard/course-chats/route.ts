import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  listCoursesForStaffGroupChat,
  listCoursePrivateThreadsForStaff,
} from "@/lib/db";

/** قائمة دورات المحادثة للموظفين */
export async function GET() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const courses = await listCoursesForStaffGroupChat(session.user.id, role);
    const privateThreads = await listCoursePrivateThreadsForStaff(session.user.id, role);
    return NextResponse.json({
      courses: courses.map((c) => ({
        courseId: c.courseId,
        courseTitle: c.courseTitle,
        courseTitleAr: c.courseTitleAr,
        lastMessageAt: c.lastMessageAt ? c.lastMessageAt.toISOString() : null,
        lastMessagePreview: c.lastMessagePreview,
        messageCount: c.messageCount,
      })),
      privateThreads: privateThreads.map((t) => ({
        conversationId: t.conversationId,
        courseId: t.courseId,
        courseTitle: t.courseTitle,
        courseTitleAr: t.courseTitleAr,
        studentName: t.studentName,
        updatedAt: t.updatedAt.toISOString(),
        lastMessagePreview: t.lastMessagePreview,
      })),
    });
  } catch (e) {
    console.error("dashboard course-chats error:", e);
    return NextResponse.json({ error: "فشل تحميل البيانات" }, { status: 500 });
  }
}
