import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCourseRatingSummary, upsertCourseRating } from "@/lib/db";
import { getCourseChatAccess } from "@/lib/course-chat-access";

type RouteParams = { params: Promise<{ id: string }> };

const MAX_FEEDBACK = 2000;

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id: courseId } = await params;
  const access = await getCourseChatAccess(courseId, session);
  if (!access?.canAccessCourse) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const summary = await getCourseRatingSummary(courseId, session.user.id);
    if (!summary) return NextResponse.json({ error: "تعذر تحميل التقييم" }, { status: 500 });
    return NextResponse.json({ summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "تعذر تحميل التقييم";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id: courseId } = await params;
  const access = await getCourseChatAccess(courseId, session);
  if (!access?.canAccessCourse) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  let body: { rating?: unknown; feedback?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "التقييم يجب أن يكون من 1 إلى 5" }, { status: 400 });
  }

  let feedback: string | null | undefined;
  if (body.feedback !== undefined && body.feedback !== null) {
    const trimmed = String(body.feedback).trim();
    if (trimmed.length > MAX_FEEDBACK) {
      return NextResponse.json({ error: "الملاحظة طويلة جداً" }, { status: 400 });
    }
    feedback = trimmed || null;
  }

  try {
    await upsertCourseRating({
      course_id: courseId,
      user_id: session.user.id,
      rating: rating as 1 | 2 | 3 | 4 | 5,
      feedback,
    });
    const summary = await getCourseRatingSummary(courseId, session.user.id);
    return NextResponse.json({ success: true, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "تعذر حفظ التقييم";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
