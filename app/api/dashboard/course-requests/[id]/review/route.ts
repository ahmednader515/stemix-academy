import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { markCourseRequestReviewed } from "@/lib/db";

/** تعليم طلب دورة كمُراجع — للأدمن ومساعد الأدمن */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const ok = await markCourseRequestReviewed(id, session.user.id);
    if (!ok) {
      return NextResponse.json({ error: "الطلب غير موجود أو تمت مراجعته مسبقاً" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("markCourseRequestReviewed error:", e);
    return NextResponse.json({ error: "فشل تحديث حالة الطلب" }, { status: 500 });
  }
}
