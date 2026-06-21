import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import { CourseRequestForm } from "./CourseRequestForm";

export default async function CourseRequestPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");

  const [user, t] = await Promise.all([getUserById(session.user.id), getServerTranslator()]);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {t("dashboard.courseRequest.backLink", "← العودة للوحة التحكم")}
        </Link>
        <h2 className="mt-2 text-xl font-bold text-[var(--color-foreground)]">
          {t("dashboard.courseRequest.pageTitle", "طلب دورة غير متاحة")}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t(
            "dashboard.courseRequest.pageSubtitle",
            "أكمل النموذج أدناه وسنراجع طلبك في أقرب وقت.",
          )}
        </p>
      </div>
      <CourseRequestForm
        defaultName={user?.name ?? session.user.name ?? ""}
        defaultEmail={user?.email ?? session.user.email ?? ""}
        defaultPhone={user?.student_number ?? ""}
        defaultWhatsapp={user?.whatsapp_number ?? ""}
      />
    </div>
  );
}
