import { revalidatePublicCatalogCache } from "@/lib/revalidate-public-cache";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCoursesPublished,
  courseExistsBySlug,
  createCourse,
  collegeIsSelectableForCourse,
} from "@/lib/db";
import { saveCourseContentFromPayload } from "@/lib/course-content-save";
import type { CourseContentPayload } from "@/lib/course-form-types";

export async function GET() {
  try {
    const courses = await getCoursesPublished(true);
    return NextResponse.json(courses);
  } catch (error) {
    console.error("API courses:", error);
    return NextResponse.json(
      { error: "فشل جلب الدورات" },
      { status: 500 }
    );
  }
}

type LessonInput = { title: string; titleAr?: string; videoUrl?: string; content?: string; pdfUrl?: string };
type QuestionOptionInput = { text: string; isCorrect: boolean };
type QuestionInput = { type: "MULTIPLE_CHOICE" | "ESSAY" | "TRUE_FALSE"; questionText: string; options?: QuestionOptionInput[] };
type QuizInput = { title: string; timeLimitMinutes?: number | null; questions: QuestionInput[] };

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  let body: {
    title?: string;
    titleAr?: string;
    titleEn?: string;
    slug: string;
    description?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    shortDesc?: string;
    shortDescAr?: string;
    shortDescEn?: string;
    imageUrl?: string;
    price?: number;
    maxQuizAttempts?: number | null;
    categoryId?: string | null;
    acceptsHomework?: boolean;
    isPublished?: boolean;
    chapters?: CourseContentPayload["chapters"];
    courseLevelItems?: CourseContentPayload["courseLevelItems"];
    lessons?: LessonInput[];
    quizzes?: QuizInput[];
    contentOrder?: Array<{ type: "lesson"; index: number } | { type: "quiz"; index: number }>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const titleAr = (body.titleAr ?? body.title)?.trim();
  const titleEn = (body.titleEn ?? body.titleAr ?? body.title)?.trim();
  const slug = body.slug?.trim();
  const descriptionAr = (body.descriptionAr ?? body.description)?.trim();
  const descriptionEn = (body.descriptionEn ?? "").trim() || null;
  if (!titleAr || !slug || !descriptionAr) {
    return NextResponse.json({ error: "العنوان والوصف بالعربية مطلوبان" }, { status: 400 });
  }

  const exists = await courseExistsBySlug(slug.trim());
  if (exists) {
    return NextResponse.json({ error: "رابط الدورة مستخدم مسبقاً" }, { status: 400 });
  }

  const categoryIdRaw = body.categoryId?.trim();
  if (!categoryIdRaw) {
    return NextResponse.json({ error: "اختر الجامعة" }, { status: 400 });
  }
  const selectable = await collegeIsSelectableForCourse(categoryIdRaw);
  if (!selectable) {
    return NextResponse.json({ error: "الجامعة غير صالحة" }, { status: 400 });
  }
  const categoryId = categoryIdRaw;

  let course;
  try {
    course = await createCourse({
      title: titleEn || titleAr,
      title_ar: titleAr,
      slug,
      description: descriptionAr,
      description_en: descriptionEn,
      short_desc: (body.shortDescAr ?? body.shortDesc)?.trim() || null,
      short_desc_en: (body.shortDescEn ?? "").trim() || null,
      image_url: body.imageUrl?.trim() || null,
      price: body.price ?? 0,
      is_published: body.isPublished === true,
      created_by_id: session.user.id,
      max_quiz_attempts: body.maxQuizAttempts ?? null,
      category_id: categoryId,
      accepts_homework: !!body.acceptsHomework,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("createCourse error:", err);
    if (msg.includes("foreign key") || msg.includes("فشل إنشاء الدورة")) {
      return NextResponse.json(
        { error: "فشل إنشاء الدورة. جرّب تسجيل الخروج ثم الدخول مرة أخرى (حسابك قد لا يكون في قاعدة البيانات الحالية)." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: msg || "فشل إنشاء الدورة" },
      { status: 500 }
    );
  }

  await saveCourseContentFromPayload(course.id, slug.trim(), body);

  revalidatePublicCatalogCache();
  return NextResponse.json({ id: course.id, title: course.title, slug: course.slug });
}
