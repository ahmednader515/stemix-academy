import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listCoursesForStaffGroupChat, listCoursePrivateThreadsForStaff } from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import { CourseChatsList } from "./CourseChatsList";

export default async function DashboardCourseChatsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    redirect("/dashboard");
  }
  const t = await getServerTranslator();

  let courses: Awaited<ReturnType<typeof listCoursesForStaffGroupChat>> = [];
  let privateThreads: Awaited<ReturnType<typeof listCoursePrivateThreadsForStaff>> = [];
  try {
    [courses, privateThreads] = await Promise.all([
      listCoursesForStaffGroupChat(session.user.id, role),
      listCoursePrivateThreadsForStaff(session.user.id, role),
    ]);
  } catch {
    courses = [];
    privateThreads = [];
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboard.courseChatsPage.title", "محادثات الدورات")}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "dashboard.courseChatsPage.subtitle",
          "تابع محادثات الدورات الجماعية ورد على الأسئلة الخاصة من الطلاب.",
        )}
      </p>
      <CourseChatsList
        initialCourses={courses.map((c) => ({
          courseId: c.courseId,
          courseTitle: c.courseTitle,
          courseTitleAr: c.courseTitleAr,
          lastMessageAt: c.lastMessageAt ? c.lastMessageAt.toISOString() : null,
          lastMessagePreview: c.lastMessagePreview,
          messageCount: c.messageCount,
        }))}
        initialPrivateThreads={privateThreads.map((p) => ({
          conversationId: p.conversationId,
          courseId: p.courseId,
          courseTitle: p.courseTitle,
          courseTitleAr: p.courseTitleAr,
          studentName: p.studentName,
          updatedAt: p.updatedAt ? p.updatedAt.toISOString() : null,
          lastMessagePreview: p.lastMessagePreview,
        }))}
        userId={session.user.id}
        userName={session.user.name ?? ""}
        userRole={role}
      />
    </div>
  );
}
