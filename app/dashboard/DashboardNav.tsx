"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/LocaleProvider";

const baseClass =
  "rounded-[var(--radius-btn)] border px-4 py-2 text-sm font-medium transition";
const inactiveClass =
  "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-border)]/50";
const activeClass =
  "border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary)]";

const warnUnreadClass =
  "border-amber-500 bg-amber-500/10 text-amber-900 shadow-[0_0_0_1px_rgba(245,158,11,0.25)]";

function NavLink({
  href,
  children,
  exact = false,
  warnUnread = false,
}: {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
  warnUnread?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  const stateClass = isActive ? activeClass : inactiveClass;
  return (
    <Link
      href={href}
      className={`${baseClass} ${warnUnread && !isActive ? warnUnreadClass : stateClass}`}
    >
      {children}
    </Link>
  );
}

export function DashboardNav({
  isAdmin,
  isAssistant,
  isTeacher,
  unreadNotificationCount = 0,
}: {
  isAdmin: boolean;
  isAssistant: boolean;
  isTeacher: boolean;
  unreadNotificationCount?: number;
}) {
  const t = useT();
  const isStaff = isAdmin || isAssistant;

  if (isTeacher) {
    return (
      <>
        <NavLink href="/dashboard/courses">{t("dashboardNav.manageMyCourses", "Manage my courses")}</NavLink>
        <NavLink href="/dashboard/courses/new" exact>
          {t("dashboardNav.createCourse", "Create course")}
        </NavLink>
        <NavLink href="/dashboard/statistics">{t("dashboardNav.studentStats", "Student statistics")}</NavLink>
        <NavLink href="/dashboard/codes">{t("dashboardNav.createCodes", "Create codes")}</NavLink>
        <NavLink href="/dashboard/homework">{t("dashboardNav.homework", "Student homework")}</NavLink>
        <NavLink href="/dashboard/course-chats">{t("dashboardNav.courseChats", "محادثات الدورات")}</NavLink>
        <NavLink href="/dashboard/course-feedback">{t("dashboardNav.courseFeedback", "تقييمات وطلبات المحتوى")}</NavLink>
        <NavLink href="/dashboard/messages">{t("dashboardNav.contactMyStudents", "Contact my students")}</NavLink>
        <NavLink href="/dashboard/live-streams">{t("dashboardNav.liveStreams", "Live streams")}</NavLink>
      </>
    );
  }

  if (!isStaff) {
    return (
      <>
        <NavLink href="/dashboard/notifications" warnUnread={unreadNotificationCount > 0}>
          <span className="inline-flex items-center gap-1.5">
            {unreadNotificationCount > 0 ? (
              <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
            ) : null}
            {t("dashboardNav.notifications", "Notifications")}
            {unreadNotificationCount > 0 ? (
              <span className="inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold leading-none text-white">
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </span>
            ) : null}
          </span>
        </NavLink>
        <NavLink href="/dashboard/messages">
          {t("dashboardNav.inbox", "Inbox")}
        </NavLink>
        <Link
          href="/courses"
          className={`${baseClass} ${inactiveClass}`}
        >
          {t("dashboardNav.availableCourses", "Available courses")}
        </Link>
      </>
    );
  }

  return (
    <>
      <NavLink href="/dashboard/students">
        {isAdmin ? t("dashboardNav.studentsAccounts", "Students & accounts") : t("dashboardNav.students", "Students")}
      </NavLink>
      <NavLink href="/dashboard/statistics">
        {t("dashboardNav.studentStats", "Student statistics")}
      </NavLink>
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/password-change-requests">
          {t("dashboardNav.passwordChangeRequests", "Account change requests")}
        </NavLink>
      )}
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/colleges">{t("dashboardNav.colleges", "Colleges")}</NavLink>
      )}
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/codes">
          {t("dashboardNav.createCodes", "Create codes")}
        </NavLink>
      )}
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/course-chats">
          {t("dashboardNav.courseChats", "محادثات الدورات")}
        </NavLink>
      )}
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/homework">
          {t("dashboardNav.homework", "Student homework")}
        </NavLink>
      )}
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/course-requests">
          {t("dashboardNav.courseRequests", "طلبات الدورات")}
        </NavLink>
      )}
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/course-feedback">
          {t("dashboardNav.courseFeedback", "تقييمات وطلبات المحتوى")}
        </NavLink>
      )}
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/messages">
          {t("dashboardNav.privateStudentMessages", "Private student messages")}
        </NavLink>
      )}
      {isAdmin && (
        <>
          <NavLink href="/dashboard/courses">
            {t("dashboardNav.manageCourses", "Manage courses")}
          </NavLink>
          <NavLink href="/dashboard/courses/new" exact>
            {t("dashboardNav.createCourse", "Create course")}
          </NavLink>
          <NavLink href="/dashboard/reviews">
            {t("dashboardNav.studentReviews", "Student reviews")}
          </NavLink>
          <NavLink href="/dashboard/settings/copyright-overlay">
            {t("dashboardNav.copyrightSettings", "Copyright code settings")}
          </NavLink>
          <NavLink href="/dashboard/live-streams">
            {t("dashboardNav.liveStreams", "Live streams")}
          </NavLink>
          <NavLink href="/dashboard/teachers">{t("dashboardNav.multipleTeachers", "Multiple teachers")}</NavLink>
          <NavLink href="/dashboard/subscriptions">{t("dashboardNav.platformSubscriptions", "Platform subscriptions")}</NavLink>
          <NavLink href="/dashboard/subscription-students">{t("dashboardNav.subscribedStudents", "Subscribed students")}</NavLink>
          <NavLink href="/dashboard/store">{t("dashboardNav.platformStore", "Platform store")}</NavLink>
        </>
      )}
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/settings/homepage">
          {t("dashboardNav.homepageSettings", "Homepage settings")}
        </NavLink>
      )}
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/settings/add-balance">
          {t("dashboardNav.paymentMethods", "Student payment methods")}
        </NavLink>
      )}
    </>
  );
}
