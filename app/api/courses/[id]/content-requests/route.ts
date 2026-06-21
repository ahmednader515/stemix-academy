import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCourseContentRequest } from "@/lib/db";
import { getCourseChatAccess } from "@/lib/course-chat-access";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id: courseId } = await params;
  const access = await getCourseChatAccess(courseId, session);
  if (!access?.canAccessCourse) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  let body: {
    description?: string;
    attachments?: Array<{ fileUrl?: string; fileName?: string; fileType?: string }>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const description = body.description?.trim();
  if (!description) {
    return NextResponse.json({ error: "الوصف مطلوب" }, { status: 400 });
  }
  if (description.length > 5000) {
    return NextResponse.json({ error: "الوصف طويل جداً" }, { status: 400 });
  }

  const attachments = (body.attachments ?? [])
    .map((a) => {
      const fileUrl = a.fileUrl?.trim();
      if (!fileUrl) return null;
      const fileType = a.fileType === "pdf" ? "pdf" : "image";
      return {
        file_url: fileUrl,
        file_name: a.fileName?.trim() || null,
        file_type: fileType as "pdf" | "image",
      };
    })
    .filter(Boolean) as Array<{ file_url: string; file_name: string | null; file_type: "pdf" | "image" }>;

  if (attachments.length === 0) {
    return NextResponse.json({ error: "يجب رفع ملف واحد على الأقل" }, { status: 400 });
  }

  try {
    const created = await createCourseContentRequest({
      course_id: courseId,
      user_id: session.user.id,
      description,
      attachments,
    });
    return NextResponse.json({ success: true, id: created.id });
  } catch (err) {
    console.error("createCourseContentRequest error:", err);
    return NextResponse.json({ error: "فشل إرسال الطلب" }, { status: 500 });
  }
}
