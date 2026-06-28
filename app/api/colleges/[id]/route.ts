import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { collegeIsManageableOnDashboard, deleteCollege } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const role = session.user.role;
  if (!collegeIsManageableOnDashboard("", session.user.id, role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }

  try {
    await deleteCollege(id.trim());
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API colleges DELETE:", error);
    return NextResponse.json({ error: "فشل حذف الجامعة" }, { status: 500 });
  }
}
