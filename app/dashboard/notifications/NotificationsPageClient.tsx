"use client";

import { useEffect } from "react";
import { StudentNotificationsList, type NotificationItem } from "../StudentNotificationsList";

export function NotificationsPageClient({ notifications }: { notifications: NotificationItem[] }) {
  useEffect(() => {
    void fetch("/api/dashboard/notifications", {
      method: "PATCH",
      credentials: "include",
    });
  }, []);

  return <StudentNotificationsList items={notifications} />;
}
