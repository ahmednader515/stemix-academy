import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCourseWithContent, getEnrollment, hasFullCourseAccessAsStudent } from "@/lib/db";
import { CourseOutlineSidebar } from "@/components/CourseOutlineSidebar";
import { buildCourseOutline, outlineItemHref } from "@/lib/course-outline";
import { CourseChatSection } from "@/components/course-chat/CourseChatSection";
import { QuizPageClient } from "./QuizPageClient";

type Props = { params: Promise<{ slug: string; quizId: string }> };

function decodeSegment(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function courseSeg(course: { slug?: string | null; id: string }): string {
  const s = (course.slug && course.slug.trim()) ? String(course.slug).trim() : "";
  const normalized = s ? s.replace(/-+$/, "").replace(/^-+/, "") : "";
  return normalized ? encodeURIComponent(normalized) : (course as { id: string }).id;
}

function lessonHref(course: { slug?: string | null; id: string }, lesson: { slug?: string | null; id: string }): string {
  const seg = courseSeg(course);
  const lessonSeg = (lesson.slug && lesson.slug.trim()) ? encodeURIComponent(lesson.slug.trim()) : lesson.id;
  return `/courses/${seg}/lessons/${lessonSeg}`;
}

function quizHref(course: { slug?: string | null; id: string }, quizId: string): string {
  return `/courses/${courseSeg(course)}/quizzes/${encodeURIComponent(quizId)}`;
}

type CourseItem =
  | { type: "lesson"; id: string; slug?: string | null }
  | { type: "quiz"; id: string };

export default async function QuizPage({ params }: Props) {
  const { slug: courseSegment, quizId } = await params;
  const courseDecoded = decodeSegment(courseSegment);
  const session = await getServerSession(authOptions);
  const viewer = session?.user
    ? { userId: session.user.id, userRole: session.user.role }
    : undefined;

  const data = await getCourseWithContent(courseDecoded, viewer);
  if (!data?.course) notFound();

  const course = data.course as unknown as Record<string, unknown> & {
    id: string;
    lessons: Record<string, unknown>[];
    quizzes?: Array<Record<string, unknown> & { _count?: { questions?: number } }>;
  };
  course.lessons = data.lessons;
  course.quizzes = data.quizzes ?? [];

  let canAccess = false;
  if (session?.user?.role === "ADMIN" || session?.user?.role === "ASSISTANT_ADMIN") canAccess = true;
  if (session?.user?.id) {
    const en = await getEnrollment(session.user.id, course.id);
    if (en) canAccess = true;
    else if (session.user.role === "STUDENT") {
      canAccess = await hasFullCourseAccessAsStudent(session.user.id, course.id);
    }
  }
  if (!canAccess) notFound();

  const quizExists = (course.quizzes ?? []).some((q) => q.id === quizId);
  if (!quizExists) notFound();

  const lessons = (course.lessons ?? []) as Array<Record<string, unknown> & { id: string; slug?: string | null }>;
  const quizzes = (course.quizzes ?? []) as Array<Record<string, unknown> & { id: string }>;
  const chapters = (data.chapters ?? []) as Record<string, unknown>[];
  const outline = buildCourseOutline(chapters, lessons, quizzes);
  const flatItems = outline.flatItems;
  const currentIndex = flatItems.findIndex((i) => i.type === "quiz" && String(i.data.id) === quizId);
  const prevItem = currentIndex > 0 ? flatItems[currentIndex - 1] : null;
  const nextItem = currentIndex >= 0 && currentIndex < flatItems.length - 1 ? flatItems[currentIndex + 1] : null;

  const createdById =
    (course.createdById as string | null | undefined) ??
    (course.created_by_id as string | null | undefined) ??
    null;
  const courseTitle = String(course.title ?? course.title_ar ?? "");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_200px]">
        <article className="min-w-0 lg:col-start-1 lg:row-start-1">
          <QuizPageClient quizId={quizId} />

          {session?.user?.id ? (
            <CourseChatSection
              courseId={course.id}
              courseTitle={courseTitle}
              createdById={createdById}
              session={session}
            />
          ) : null}

          {/* أزرار السابق والتالي أسفل الاختبار */}
          <nav className="mx-auto mt-8 flex w-full max-w-3xl items-center justify-between gap-4 border-t border-[var(--color-border)] px-4 pt-6 sm:px-6">
            {prevItem ? (
              <Link
                href={outlineItemHref(course, prevItem)}
                className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium transition hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-background)]"
              >
                ← {prevItem.type === "lesson" ? "الحصة السابقة" : "الاختبار السابق"}
              </Link>
            ) : (
              <span />
            )}
            {nextItem ? (
              <Link
                href={outlineItemHref(course, nextItem)}
                className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-3 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)]"
              >
                {nextItem.type === "lesson" ? "الحصة التالية" : "الاختبار التالي"} →
              </Link>
            ) : null}
          </nav>
        </article>

        <aside className="order-first lg:col-start-2 lg:row-start-1 lg:order-none">
          <CourseOutlineSidebar
            course={course}
            chapters={chapters}
            lessons={lessons as Array<Record<string, unknown> & { id: string; title?: string; titleAr?: string | null }>}
            quizzes={quizzes as Array<Record<string, unknown> & { id: string; title?: string; _count?: { questions?: number } }>}
            currentLessonId={null}
            currentQuizId={quizId}
          />
        </aside>
      </div>
    </div>
  );
}
