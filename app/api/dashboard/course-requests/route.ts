import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listCourseRequestsForAdmin } from "@/lib/db";

/** قائمة طلبات الدورات — للأدمن ومساعد الأدمن */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const search = request.nextUrl.searchParams.get("search");
  try {
    const list = await listCourseRequestsForAdmin(search);
    return NextResponse.json(list);
  } catch (e) {
    console.error("listCourseRequestsForAdmin error:", e);
    return NextResponse.json({ error: "فشل تحميل الطلبات" }, { status: 500 });
  }
}
