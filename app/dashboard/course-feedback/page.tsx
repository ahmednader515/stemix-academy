import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listFeedbacksForStaff, listCourseContentRequestsForStaff } from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import { mapStaffFeedbackRow } from "@/lib/staff-feedback-rows";
import { mapCourseContentRequestRow } from "@/lib/course-content-request-rows";
import type { StaffFeedbackRow } from "@/lib/staff-feedback-rows";
import type { CourseContentRequestRow } from "@/lib/course-content-request-rows";
import { CourseFeedbackDashboard } from "./CourseFeedbackDashboard";

export default async function DashboardCourseFeedbackPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    redirect("/dashboard");
  }
  const t = await getServerTranslator();
  const teacherId = role === "TEACHER" ? session.user.id : null;

  let feedbacks: StaffFeedbackRow[] = [];
  let contentRequests: CourseContentRequestRow[] = [];
  try {
    const [fb, cr] = await Promise.all([
      listFeedbacksForStaff({ teacherId }),
      listCourseContentRequestsForStaff({ teacherId }),
    ]);
    feedbacks = fb.map(mapStaffFeedbackRow);
    contentRequests = cr.map(mapCourseContentRequestRow);
  } catch (e) {
    console.error("course-feedback page load error:", e);
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboard.courseFeedbackPage.title", "تقييمات الدورات وطلبات المحتوى")}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "dashboard.courseFeedbackPage.subtitle",
          "راجع تقييمات الطلاب وملاحظاتهم وطلبات شرح المحتوى الجديد.",
        )}
      </p>
      <CourseFeedbackDashboard
        initialFeedbacks={feedbacks}
        initialContentRequests={contentRequests}
      />
    </div>
  );
}
