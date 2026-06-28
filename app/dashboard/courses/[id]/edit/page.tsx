import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getCourseForEdit } from "@/lib/db";
import { canManageCourse } from "@/lib/permissions";
import { buildInitialCourseContentState } from "@/lib/course-form-initial";
import { EditCourseForm } from "./EditCourseForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditCoursePage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "TEACHER") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const data = await getCourseForEdit(id);

  if (!data?.course) notFound();

  const c = data.course as Record<string, unknown>;
  const createdBy =
    (c.createdById as string | null | undefined) ??
    (c.created_by_id as string | null | undefined) ??
    null;
  if (!canManageCourse(role, session.user.id, createdBy)) {
    redirect("/dashboard");
  }

  const quizRows = data.quizzes.map((q) => {
    const row = q as Record<string, unknown>;
    return {
      ...row,
      questions: (q.questions ?? []).map((qt) => {
        const qtr = qt as Record<string, unknown>;
        return {
          type: qtr.type,
          questionText: qtr.questionText ?? qtr.question_text,
          options: ((qtr.options ?? []) as Array<Record<string, unknown>>).map((o) => {
            const or = o as Record<string, unknown>;
            return { text: or.text, isCorrect: or.isCorrect ?? or.is_correct };
          }),
        };
      }),
    };
  });

  const { chapters, courseLevelItems } = buildInitialCourseContentState(
    data.chapters as Record<string, unknown>[],
    data.lessons as Record<string, unknown>[],
    quizRows as Record<string, unknown>[],
    () => [
      { text: "صح", isCorrect: true },
      { text: "خطأ", isCorrect: false },
    ]
  );

  const initialData = {
    id: String(c.id ?? ""),
    titleEn: String(c.title ?? ""),
    titleAr: String(c.titleAr ?? c.title_ar ?? ""),
    descriptionAr: String(c.description ?? ""),
    descriptionEn: String(c.descriptionEn ?? c.description_en ?? ""),
    shortDescAr: String(c.shortDesc ?? c.short_desc ?? ""),
    shortDescEn: String(c.shortDescEn ?? c.short_desc_en ?? ""),
    imageUrl: String(c.imageUrl ?? c.image_url ?? ""),
    price: String(Number(c.price ?? 0)),
    isPublished: Boolean(c.isPublished ?? c.is_published ?? true),
    maxQuizAttempts:
      typeof c.maxQuizAttempts === "number"
        ? c.maxQuizAttempts
        : typeof c.max_quiz_attempts === "number"
          ? c.max_quiz_attempts
          : null,
    categoryId: (c.categoryId ?? c.category_id ?? "") as string,
    chapters,
    courseLevelItems,
  };

  return (
    <div>
      <Link
        href="/dashboard/courses"
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        ← العودة إلى إدارة الكورسات
      </Link>
      <h2 className="mt-4 text-xl font-bold text-[var(--color-foreground)]">
        تعديل الدورة
      </h2>
      <EditCourseForm courseId={id} initialData={initialData} canManageColleges={role === "ADMIN"} />
    </div>
  );
}
