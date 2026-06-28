import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getSubscriptionsFeatureEnabled, getCoursesWithCounts, listSubscriptionPlansAll } from "@/lib/db";
import { SubscriptionsAdminClient, type AdminPlanRow, type CourseOption } from "./SubscriptionsAdminClient";

export default async function SubscriptionsDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const enabled = await getSubscriptionsFeatureEnabled();
  let plans: AdminPlanRow[] = [];
  let courseOptions: CourseOption[] = [];
  try {
    const rows = await listSubscriptionPlansAll();
    plans = rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      imageUrl: r.imageUrl,
      durationKind: r.durationKind,
      expiryMode: r.expiryMode,
      fixedExpiresAt: r.fixedExpiresAt,
      courseIds: r.courseIds,
      price: r.price,
      isActive: r.isActive,
    }));
  } catch {
    plans = [];
  }
  try {
    const courses = await getCoursesWithCounts();
    courseOptions = courses
      .filter((c) => {
        const pub = Boolean((c as { isPublished?: boolean }).isPublished ?? (c as { is_published?: boolean }).is_published);
        const price = Number((c as { price?: unknown }).price) || 0;
        return pub && price > 0;
      })
      .map((c) => ({
        id: String(c.id),
        title: String(
          (c as { titleAr?: string | null }).titleAr ??
            (c as { title_ar?: string | null }).title_ar ??
            (c as { title?: string }).title ??
            "",
        ),
      }));
  } catch {
    courseOptions = [];
  }

  return <SubscriptionsAdminClient initialEnabled={enabled} initialPlans={plans} courseOptions={courseOptions} />;
}
