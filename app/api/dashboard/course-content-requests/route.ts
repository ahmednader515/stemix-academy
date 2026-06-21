import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listCourseContentRequestsForStaff } from "@/lib/db";
import { mapCourseContentRequestRow } from "@/lib/course-content-request-rows";

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
  const statusParam = request.nextUrl.searchParams.get("status");
  const status =
    statusParam === "pending" || statusParam === "reviewed" ? statusParam : null;

  try {
    const rows = await listCourseContentRequestsForStaff({
      teacherId: staffTeacherId(role, session.user.id),
      search,
      status,
    });
    return NextResponse.json(rows.map(mapCourseContentRequestRow));
  } catch (e) {
    console.error("listCourseContentRequestsForStaff error:", e);
    return NextResponse.json({ error: "فشل تحميل الطلبات" }, { status: 500 });
  }
}
