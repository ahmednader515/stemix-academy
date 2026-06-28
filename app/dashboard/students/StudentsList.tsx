"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AddBalanceButton } from "./AddBalanceButton";
import { BulkNotifyModal } from "./BulkNotifyModal";
import { useT } from "@/components/LocaleProvider";
import { useDashboardTable } from "@/lib/i18n/dashboard-table";
import { isValidEgyptWhatsapp, normalizeEgyptWhatsapp } from "@/lib/whatsapp-phone";
import { downloadStudentsExcel } from "@/lib/export-students-excel";

type Course = { id: string; title: string; titleAr: string | null; slug: string };

type Enrollment = {
  id: string;
  courseId: string;
  course: Course;
};

type Student = {
  id: string;
  name: string;
  email: string;
  role: string;
  balance: number;
  student_number?: string | null;
  guardian_number?: string | null;
  whatsapp_number?: string | null;
  copyright_code?: string | null;
  _count: { enrollments: number };
  enrollments: Enrollment[];
};

const ROLE_HEADER_KEYS: Record<string, string> = {
  ADMIN: "header.role.ADMIN",
  ASSISTANT_ADMIN: "header.role.ASSISTANT_ADMIN",
  STUDENT: "header.role.STUDENT",
};

const EDIT_ROLE_OPTIONS = ["STUDENT", "ASSISTANT_ADMIN", "ADMIN"] as const;

function translateRole(role: string, t: (key: string, fallback?: string) => string): string {
  const key = ROLE_HEADER_KEYS[role];
  return key ? t(key, role) : role;
}

export function StudentsList({
  students: initialStudents,
  courses,
  isAdmin,
  canAddBalance = false,
  canManageEnrollments = true,
  canEditFullProfile = true,
}: {
  students: Student[];
  courses: Course[];
  isAdmin: boolean;
  canAddBalance?: boolean;
  canManageEnrollments?: boolean;
  canEditFullProfile?: boolean;
}) {
  void isAdmin;
  const t = useT();
  const { dir, thClass } = useDashboardTable();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editStudentNumber, setEditStudentNumber] = useState("");
  const [editWhatsappNumber, setEditWhatsappNumber] = useState("");
  const [coursesStudent, setCoursesStudent] = useState<Student | null>(null);
  const [addCourseId, setAddCourseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [enrollError, setEnrollError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkNotifyTarget, setBulkNotifyTarget] = useState<"selected" | "all" | null>(null);
  const [exporting, setExporting] = useState(false);

  const dash = t("dashboard.studentsPage.dash", "—");
  const egp = t("common.egyptianPoundShort", "EGP");

  const filtered = useMemo(() => {
    if (!search.trim()) return initialStudents;
    const q = search.trim().toLowerCase();
    return initialStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.student_number ?? "").toLowerCase().includes(q) ||
        (s.whatsapp_number ?? "").toLowerCase().includes(q) ||
        (s.copyright_code ?? "").toLowerCase().includes(q),
    );
  }, [initialStudents, search]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((s) => selectedIds.has(s.id));
  const selectedFilteredCount = filtered.filter((s) => selectedIds.has(s.id)).length;

  function toggleSelectAllFiltered() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((s) => next.delete(s.id));
      } else {
        filtered.forEach((s) => next.add(s.id));
      }
      return next;
    });
  }

  function toggleSelectStudent(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const bulkModalStudents = useMemo(() => {
    if (!bulkNotifyTarget) return [];
    if (bulkNotifyTarget === "all") return filtered;
    return filtered.filter((s) => selectedIds.has(s.id));
  }, [bulkNotifyTarget, filtered, selectedIds]);

  async function handleExportExcel() {
    if (filtered.length === 0) return;
    setExporting(true);
    try {
      const datePart = new Date().toISOString().slice(0, 10);
      await downloadStudentsExcel(
        filtered.map((s) => ({
          name: s.name,
          email: s.email,
          studentNumber: s.student_number ?? dash,
          whatsapp: s.whatsapp_number ?? dash,
          copyrightCode: s.copyright_code ?? dash,
          balance: `${Number(s.balance).toFixed(2)} ${egp}`,
          coursesCount: s._count.enrollments,
          enrolledCourses:
            s.enrollments.length > 0
              ? s.enrollments.map((e) => e.course.titleAr ?? e.course.title).join("، ")
              : dash,
        })),
        {
          name: t("dashboard.studentsPage.colName", "Name"),
          email: t("dashboard.studentsPage.colEmailFull", "Email"),
          studentNumber: t("dashboard.studentsPage.colStudentNumber", "Student number"),
          whatsapp: t("dashboard.studentsPage.colWhatsappNumber", "WhatsApp"),
          copyrightCode: t("dashboard.studentsPage.colCopyright", "Copyright code"),
          balance: t("dashboard.studentsPage.colBalance", "Balance"),
          coursesCount: t("dashboard.studentsPage.colCourses", "Courses"),
          enrolledCourses: t("dashboard.studentsPage.colEnrolledCourses", "Enrolled courses"),
          sheetName: t("dashboard.studentsPage.exportSheetName", "Students"),
        },
        `students-${datePart}.xlsx`,
      );
    } finally {
      setExporting(false);
    }
  }

  function openEdit(s: Student) {
    setEditStudent(s);
    setEditName(s.name);
    setEditEmail(s.email);
    setEditRole(s.role);
    setEditPassword("");
    setEditStudentNumber(s.student_number ?? "");
    setEditWhatsappNumber(s.whatsapp_number ?? "");
    setError("");
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editStudent) return;
    setError("");
    const whatsappRaw = editWhatsappNumber.trim();
    if (whatsappRaw && !isValidEgyptWhatsapp(whatsappRaw)) {
      setError(
        t(
          "dashboard.studentsPage.whatsappInvalidFormat",
          "WhatsApp number must start with 20 and be 12 digits (e.g. 201012345678)",
        ),
      );
      return;
    }
    setLoading(true);
    const payload: {
      name?: string;
      email?: string;
      role?: string;
      password?: string;
      student_number?: string | null;
      whatsapp_number?: string | null;
    } = {
      name: editName.trim(),
      student_number: editStudentNumber.trim() || null,
      whatsapp_number: whatsappRaw ? normalizeEgyptWhatsapp(whatsappRaw) : null,
    };
    if (canEditFullProfile) {
      payload.email = editEmail.trim();
      payload.role = editRole;
    }
    if (editPassword.trim().length >= 6) payload.password = editPassword.trim();
    const res = await fetch(`/api/dashboard/students/${editStudent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? t("dashboard.studentsPage.errorUpdateFailed", "Update failed"));
      return;
    }
    setEditStudent(null);
    router.refresh();
  }

  function openCourses(s: Student) {
    setCoursesStudent(s);
    setAddCourseId("");
    setEnrollError("");
  }

  const availableToAdd = useMemo(() => {
    if (!coursesStudent) return [];
    const enrolledIds = new Set(coursesStudent.enrollments.map((e) => e.courseId));
    return courses.filter((c) => !enrolledIds.has(c.id));
  }, [coursesStudent, courses]);

  async function handleAddCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!coursesStudent || !addCourseId.trim()) return;
    setEnrollError("");
    setLoading(true);
    const res = await fetch(`/api/dashboard/students/${coursesStudent.id}/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: addCourseId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setEnrollError(data.error ?? t("dashboard.studentsPage.errorAddCourseFailed", "Failed to add course"));
      return;
    }
    setAddCourseId("");
    router.refresh();
    setCoursesStudent((prev) => {
      if (!prev) return null;
      const course = courses.find((c) => c.id === addCourseId);
      if (!course) return prev;
      return {
        ...prev,
        enrollments: [...prev.enrollments, { id: "", courseId: course.id, course }],
        _count: { enrollments: prev._count.enrollments + 1 },
      };
    });
  }

  async function handleRemoveCourse(courseId: string) {
    if (!coursesStudent) return;
    setEnrollError("");
    setLoading(true);
    const res = await fetch(`/api/dashboard/students/${coursesStudent.id}/enrollments/${courseId}`, {
      method: "DELETE",
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setEnrollError(
        data.error ?? t("dashboard.studentsPage.errorRemoveCourseFailed", "Failed to remove course"),
      );
      return;
    }
    router.refresh();
    setCoursesStudent((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        enrollments: prev.enrollments.filter((e) => e.courseId !== courseId),
        _count: { enrollments: prev._count.enrollments - 1 },
      };
    });
  }

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-[var(--color-foreground)]">
          {t(
            "dashboard.studentsPage.searchLabel",
            "Search by name, email, student number, WhatsApp, or copyright code",
          )}
        </label>
        <input
          type="text"
          dir={dir}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t(
            "dashboard.studentsPage.searchPlaceholder",
            "Name, email, numbers, or copyright code (e.g. A0125)…",
          )}
          className="mt-1 w-full max-w-md rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggleSelectAllFiltered}
          className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] hover:border-[var(--color-primary)]"
        >
          {allFilteredSelected
            ? t("dashboard.studentsPage.clearSelection", "Clear selection")
            : t("dashboard.studentsPage.selectAllFiltered", "Select all shown")}
        </button>
        {selectedFilteredCount > 0 ? (
          <span className="text-sm text-[var(--color-muted)]">
            {t("dashboard.studentsPage.selectedCount", "{count} selected").replace(
              "{count}",
              String(selectedFilteredCount),
            )}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => setBulkNotifyTarget("selected")}
          disabled={selectedFilteredCount === 0}
          className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {t("dashboard.studentsPage.bulkNotifySelected", "Notify — selected")}
        </button>
        <button
          type="button"
          onClick={() => setBulkNotifyTarget("all")}
          disabled={filtered.length === 0}
          className="rounded-[var(--radius-btn)] border border-[var(--color-primary)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 disabled:opacity-50"
        >
          {t("dashboard.studentsPage.bulkNotifyAll", "Notify — all shown")}
        </button>
        <button
          type="button"
          onClick={handleExportExcel}
          disabled={filtered.length === 0 || exporting}
          className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] hover:border-[var(--color-primary)] disabled:opacity-50"
        >
          {exporting
            ? t("dashboard.studentsPage.exportingExcel", "جاري التصدير...")
            : t("dashboard.studentsPage.exportExcel", "تصدير Excel")}
        </button>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table dir={dir} className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/50">
              <th className={`${thClass} w-10`}>
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAllFiltered}
                  aria-label={t("dashboard.studentsPage.selectAllFiltered", "Select all shown")}
                  className="h-4 w-4 rounded border-[var(--color-border)]"
                />
              </th>
              <th className={thClass}>{t("dashboard.studentsPage.colName", "Name")}</th>
              <th className={thClass}>{t("dashboard.studentsPage.colEmail", "Email")}</th>
              <th className={thClass}>{t("dashboard.studentsPage.colStudentNumber", "Student number")}</th>
              <th className={thClass}>{t("dashboard.studentsPage.colWhatsappNumber", "WhatsApp")}</th>
              <th className={thClass}>{t("dashboard.studentsPage.colCopyright", "Copyright code")}</th>
              <th className={thClass}>{t("dashboard.studentsPage.colBalance", "Balance")}</th>
              <th className={thClass}>{t("dashboard.studentsPage.colCourses", "Courses")}</th>
              {canAddBalance && (
                <th className={thClass}>{t("dashboard.studentsPage.colAddBalance", "Add balance")}</th>
              )}
              {canManageEnrollments && (
                <th className={thClass}>{t("dashboard.studentsPage.colManageCourses", "Manage courses")}</th>
              )}
              <th className={thClass}>{t("dashboard.studentsPage.colEdit", "Edit")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(s.id)}
                    onChange={() => toggleSelectStudent(s.id)}
                    aria-label={t("dashboard.studentsPage.selectStudent", "Select {name}").replace("{name}", s.name)}
                    className="h-4 w-4 rounded border-[var(--color-border)]"
                  />
                </td>
                <td className="p-3 font-medium text-[var(--color-foreground)]">{s.name}</td>
                <td className="p-3 text-[var(--color-muted)]">{s.email}</td>
                <td className="p-3 text-[var(--color-foreground)]">{s.student_number ?? dash}</td>
                <td className="p-3 text-[var(--color-foreground)]">{s.whatsapp_number ?? dash}</td>
                <td className="p-3 font-mono text-sm text-[var(--color-foreground)]">
                  {s.copyright_code ?? dash}
                </td>
                <td className="p-3">
                  {Number(s.balance).toFixed(2)} {egp}
                </td>
                <td className="p-3">{s._count.enrollments}</td>
                {canAddBalance && (
                  <td className="p-3">
                    <AddBalanceButton studentId={s.id} studentName={s.name} />
                  </td>
                )}
                {canManageEnrollments && (
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => openCourses(s)}
                      className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                      {t("dashboard.studentsPage.manageCourses", "Manage courses")}
                    </button>
                  </td>
                )}
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => openEdit(s)}
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                  >
                    {t("dashboard.studentsPage.edit", "Edit")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <p className="mt-4 text-center text-[var(--color-muted)]">
          {search.trim()
            ? t("dashboard.studentsPage.emptyNoResults", "No search results.")
            : t("dashboard.studentsPage.emptyNoStudents", "No students registered yet.")}
        </p>
      )}

      {coursesStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            dir={dir}
            className="w-full max-w-lg rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              {t("dashboard.studentsPage.coursesModalTitlePrefix", "Manage courses —")} {coursesStudent.name}
            </h3>
            {enrollError ? (
              <p className="mt-2 text-sm text-red-600">{enrollError}</p>
            ) : null}
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-[var(--color-foreground)]">
                {t("dashboard.studentsPage.enrolledInCourses", "Enrolled courses:")}
              </p>
              {coursesStudent.enrollments.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">
                  {t("dashboard.studentsPage.noEnrollmentsYet", "None")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {coursesStudent.enrollments.map((e) => (
                    <li
                      key={e.courseId}
                      className="flex items-center justify-between rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                    >
                      <span className="text-sm">{e.course.titleAr ?? e.course.title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCourse(e.courseId)}
                        disabled={loading}
                        className="text-sm text-red-600 hover:underline disabled:opacity-50"
                      >
                        {t("dashboard.studentsPage.remove", "Remove")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {availableToAdd.length > 0 && (
                <form onSubmit={handleAddCourse} className="flex flex-wrap items-end gap-2 pt-2">
                  <div className="min-w-[180px] flex-1">
                    <label className="block text-xs text-[var(--color-muted)]">
                      {t("dashboard.studentsPage.addCourseLabel", "Add course")}
                    </label>
                    <select
                      value={addCourseId}
                      onChange={(e) => setAddCourseId(e.target.value)}
                      className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                    >
                      <option value="">
                        {t("dashboard.studentsPage.selectCoursePlaceholder", "— Choose a course —")}
                      </option>
                      {availableToAdd.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.titleAr ?? c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !addCourseId}
                    className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                  >
                    {t("dashboard.studentsPage.add", "Add")}
                  </button>
                </form>
              )}
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  setCoursesStudent(null);
                  setEnrollError("");
                }}
                className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
              >
                {t("dashboard.studentsPage.close", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkNotifyTarget ? (
        <BulkNotifyModal
          students={bulkModalStudents.map((s) => ({ id: s.id, name: s.name }))}
          onClose={() => setBulkNotifyTarget(null)}
        />
      ) : null}

      {editStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            dir={dir}
            className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              {t("dashboard.studentsPage.editStudentTitle", "Edit student")}
            </h3>
            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {editStudent.copyright_code ? (
                <p className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-muted)]">
                  <span className="font-medium text-[var(--color-foreground)]">
                    {t("dashboard.studentsPage.copyrightCodeLabel", "Copyright code:")}{" "}
                  </span>
                  <span className="font-mono font-semibold text-[var(--color-primary)]">
                    {editStudent.copyright_code}
                  </span>
                  <span className="mt-2 block text-xs">{t(
                    "dashboard.studentsPage.copyrightCodeNote",
                    "Shown on the lesson player for the student and cannot be edited here.",
                  )}</span>
                </p>
              ) : null}
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">
                  {t("dashboard.studentsPage.nameLabel", "Name")}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">
                  {t("dashboard.studentsPage.studentNumberLabel", "Student number")}
                </label>
                <input
                  type="text"
                  value={editStudentNumber}
                  onChange={(e) => setEditStudentNumber(e.target.value)}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                  placeholder={t(
                    "dashboard.studentsPage.studentNumberPlaceholder",
                    "Student number",
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">
                  {t("dashboard.studentsPage.whatsappNumberLabel", "WhatsApp number")}
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={editWhatsappNumber}
                  onChange={(e) => setEditWhatsappNumber(e.target.value)}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-right"
                  placeholder={t(
                    "dashboard.studentsPage.whatsappNumberPlaceholder",
                    "201012345678",
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">
                  {t("dashboard.studentsPage.newPasswordOptional", "New password (optional)")}
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder={t(
                    "dashboard.studentsPage.passwordKeepCurrentPlaceholder",
                    "Leave blank to keep the current password",
                  )}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              {canEditFullProfile && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-foreground)]">
                      {t("dashboard.studentsPage.emailLabel", "Email")}
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-foreground)]">
                      {t("dashboard.studentsPage.accountRoleLabel", "Account role")}
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                    >
                      {EDIT_ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {translateRole(r, t)}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditStudent(null);
                    setError("");
                  }}
                  className="flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] py-2 text-sm font-medium"
                >
                  {t("dashboard.studentsPage.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-[var(--radius-btn)] bg-[var(--color-primary)] py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {loading
                    ? t("dashboard.studentsPage.saving", "Saving...")
                    : t("dashboard.studentsPage.save", "Save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
