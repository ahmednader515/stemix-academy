import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageCourse } from "@/lib/permissions";
import { getCourseById, getLessonsByCourseId, getChaptersByCourseId } from "@/lib/db";

/** جلب حصص دورة — للأدمن/مساعد الأدمن */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
  }
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "معرّف الدورة مطلوب" }, { status: 400 });
  }

  const course = await getCourseById(id.trim());
  if (!course) {
    return NextResponse.json({ error: "الدورة غير موجودة" }, { status: 404 });
  }
  const createdBy = (course as { createdById?: string | null; created_by_id?: string | null }).createdById ?? (course as { created_by_id?: string | null }).created_by_id ?? null;
  if (!canManageCourse(session.user.role, session.user.id, createdBy)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const [lessons, chapters] = await Promise.all([
      getLessonsByCourseId(id.trim()),
      getChaptersByCourseId(id.trim()),
    ]);
    const chapterById = new Map(chapters.map((ch) => [ch.id, ch]));
    const payload = lessons.map((l) => {
      const r = l as unknown as Record<string, unknown>;
      const chapterId = (r.chapterId ?? r.chapter_id ?? null) as string | null;
      const ch = chapterId ? chapterById.get(chapterId) : null;
      return {
        id: String(r.id ?? ""),
        title: String(r.title ?? ""),
        titleAr: (r.titleAr ?? r.title_ar ?? null) as string | null,
        order: Number(r.order ?? 0),
        chapterId,
        chapterTitle: ch ? String(ch.title_ar ?? ch.title ?? "") : null,
      };
    });
    return NextResponse.json({ lessons: payload, chapters: chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      titleAr: ch.title_ar,
      order: ch.order,
    })) });
  } catch (e) {
    console.error("dashboard course lessons:", e);
    return NextResponse.json({ error: "فشل جلب الحصص" }, { status: 500 });
  }
}

