import Link from "next/link";
import { getServerTranslator } from "@/lib/i18n/server";

export async function CourseRequestPromptSection() {
  const t = await getServerTranslator();

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {t("dashboard.courseRequest.promptTitle", "طلب دورة غير متاحة")}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {t(
              "dashboard.courseRequest.promptDesc",
              "لم تجد الدورة التي تبحث عنها؟ أرسل طلباً مع تفاصيل الدورة ومرفقات مرجعية وسنراجع طلبك.",
            )}
          </p>
        </div>
        <Link
          href="/dashboard/course-request"
          className="inline-flex shrink-0 items-center justify-center rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)]"
        >
          {t("dashboard.courseRequest.promptButton", "تقديم طلب دورة")}
        </Link>
      </div>
    </section>
  );
}
