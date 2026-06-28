import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { listStudentNotificationsForUser } from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import { NotificationsPageClient } from "./NotificationsPageClient";

export default async function StudentNotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");

  const t = await getServerTranslator();
  let notifications: Awaited<ReturnType<typeof listStudentNotificationsForUser>> = [];
  try {
    notifications = await listStudentNotificationsForUser(session.user.id, 100);
  } catch {
    notifications = [];
  }

  const items = notifications.map((n) => ({
    id: n.id,
    message: n.message,
    senderName: n.senderName,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt),
  }));

  return (
    <div>
      <Link
        href="/dashboard"
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        ← {t("dashboard.backToDashboard", "Back to dashboard")}
      </Link>
      <h2 className="mt-4 text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboard.notificationsPage.title", "Notifications")}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t("dashboard.notificationsPage.subtitle", "All messages from your teachers and the platform team")}
      </p>
      <div className="mt-6">
        <NotificationsPageClient notifications={items} />
      </div>
    </div>
  );
}
