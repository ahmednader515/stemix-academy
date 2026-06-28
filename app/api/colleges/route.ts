import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createCollege,
  findCollegeByNameAr,
  getCollegesForAdmin,
  getCollegesForDashboard,
} from "@/lib/db";

function slugFromName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "");
  return base || "college";
}

/** قائمة الكليات — للاختيار في نموذج الدورة (مدرس/أدمن) أو الإدارة الكاملة للأدمن */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const role = session.user.role;
    if (role === "ADMIN" || role === "ASSISTANT_ADMIN") {
      const colleges = await getCollegesForAdmin();
      return NextResponse.json({ colleges });
    }
    if (role === "TEACHER") {
      const colleges = await getCollegesForDashboard(session.user.id, role);
      return NextResponse.json({ colleges });
    }
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  } catch (error) {
    console.error("API colleges GET:", error);
    return NextResponse.json({ error: "فشل جلب الجامعات" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  let body: { nameAr?: string; name?: string; slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const nameAr = (body.nameAr ?? body.name)?.trim();
  if (!nameAr) {
    return NextResponse.json({ error: "اسم الجامعة بالعربية مطلوب" }, { status: 400 });
  }

  const existing = await findCollegeByNameAr(nameAr);
  if (existing) {
    return NextResponse.json({ error: "جامعة بهذا الاسم موجودة مسبقاً" }, { status: 400 });
  }

  const slugBase = body.slug?.trim() || slugFromName(nameAr);
  const uniqueSlug = `${slugBase}-${Date.now()}`;

  try {
    const college = await createCollege({
      name: nameAr,
      name_ar: nameAr,
      slug: uniqueSlug,
    });
    return NextResponse.json({ success: true, college });
  } catch (error) {
    console.error("API colleges POST:", error);
    return NextResponse.json({ error: "فشل إنشاء الجامعة" }, { status: 500 });
  }
}
