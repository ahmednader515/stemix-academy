import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listFeedbacksForStaff } from "@/lib/db";
import { mapStaffFeedbackRow } from "@/lib/staff-feedback-rows";

function staffTeacherId(role: string, userId: string): string | null {
  return role === "TEACHER" ? userId : null;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const search = request.nextUrl.searchParams.get("search");
  try {
    const items = await listFeedbacksForStaff({
      teacherId: staffTeacherId(role, session.user.id),
      search,
    });
    return NextResponse.json(items.map(mapStaffFeedbackRow));
  } catch (e) {
    console.error("listFeedbacksForStaff error:", e);
    return NextResponse.json({ error: "فشل تحميل التقييمات" }, { status: 500 });
  }
}
