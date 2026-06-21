import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteCourseRequestById } from "@/lib/db";

/** حذف طلب دورة — للأدمن ومساعد الأدمن */
export async function DELETE(
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
    const ok = await deleteCourseRequestById(id);
    if (!ok) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("deleteCourseRequestById error:", e);
    return NextResponse.json({ error: "فشل حذف الطلب" }, { status: 500 });
  }
}
