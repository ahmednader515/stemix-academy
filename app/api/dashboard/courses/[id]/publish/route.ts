import { revalidatePublicCatalogCache } from "@/lib/revalidate-public-cache";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageCourse } from "@/lib/permissions";
import { getCourseById, updateCourse } from "@/lib/db";

/** تبديل حالة نشر الدورة — للأدمن والمدرس */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  let body: { isPublished?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  if (typeof body.isPublished !== "boolean") {
    return NextResponse.json({ error: "حالة النشر مطلوبة" }, { status: 400 });
  }

  const course = await getCourseById(id);
  if (!course) {
    return NextResponse.json({ error: "الدورة غير موجودة" }, { status: 404 });
  }

  const createdBy =
    (course as { createdById?: string | null }).createdById ??
    (course as { created_by_id?: string | null }).created_by_id ??
    null;
  if (!canManageCourse(session.user.role, session.user.id, createdBy)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  await updateCourse(id, { is_published: body.isPublished });
  revalidatePublicCatalogCache();

  return NextResponse.json({ ok: true, isPublished: body.isPublished });
}
