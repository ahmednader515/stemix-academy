import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteCourseContentRequestById } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
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
    await deleteCourseContentRequestById(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("deleteCourseContentRequestById error:", e);
    return NextResponse.json({ error: "فشل حذف الطلب" }, { status: 500 });
  }
}
