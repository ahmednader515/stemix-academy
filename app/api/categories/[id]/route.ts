import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { collegeIsManageableOnDashboard, deleteCollege } from "@/lib/db";

/** @deprecated use DELETE /api/colleges/[id] */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const role = session.user.role;
  if (!collegeIsManageableOnDashboard("", session.user.id, role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "معرّف الجامعة مطلوب" }, { status: 400 });
  }

  try {
    await deleteCollege(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("API categories [id] DELETE:", e);
    return NextResponse.json({ error: "فشل حذف الجامعة" }, { status: 500 });
  }
}
