import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollegesForDashboard } from "@/lib/db";

/** @deprecated use GET /api/colleges */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const role = session.user.role;
    if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    const categories = await getCollegesForDashboard(session.user.id, role);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("API categories:", error);
    return NextResponse.json(
      { error: "فشل جلب التصنيفات" },
      { status: 500 }
    );
  }
}
