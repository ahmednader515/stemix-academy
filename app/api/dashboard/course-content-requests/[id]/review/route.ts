import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { markCourseContentRequestReviewed } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const ok = await markCourseContentRequestReviewed(id, session.user.id);
    if (!ok) return NextResponse.json({ error: "تعذر تحديث الطلب" }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("markCourseContentRequestReviewed error:", e);
    return NextResponse.json({ error: "فشل تحديث الطلب" }, { status: 500 });
  }
}
