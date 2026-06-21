import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listCourseRequestsForAdmin } from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import { CourseRequestsList } from "./CourseRequestsList";
import { mapCourseRequestRow } from "@/lib/course-request-rows";

export default async function DashboardCourseRequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN") redirect("/dashboard");
  const t = await getServerTranslator();

  let requests: ReturnType<typeof mapCourseRequestRow>[] = [];
  try {
    const rows = await listCourseRequestsForAdmin();
    requests = rows.map(mapCourseRequestRow);
  } catch (e) {
    console.error("listCourseRequestsForAdmin error:", e);
    requests = [];
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboard.courseRequestsPage.title", "طلبات الدورات من الطلاب")}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "dashboard.courseRequestsPage.subtitle",
          "الطلبات التي أرسلها الطلاب لدورات غير متاحة على المنصة.",
        )}
      </p>
      <CourseRequestsList initialRequests={requests} />
    </div>
  );
}
