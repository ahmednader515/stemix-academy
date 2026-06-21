import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteCourseGroupMessageById, getCourseGroupMessageById } from "@/lib/db";
import { getCourseChatAccess } from "@/lib/course-chat-access";

type RouteParams = { params: Promise<{ id: string; messageId: string }> };

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id: courseId, messageId } = await params;
  const access = await getCourseChatAccess(courseId, session);
  if (!access?.canGroupChat) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const msg = await getCourseGroupMessageById(messageId);
  if (!msg || msg.course_id !== courseId) {
    return NextResponse.json({ error: "الرسالة غير موجودة" }, { status: 404 });
  }
  if (msg.sender_id !== session.user.id) {
    return NextResponse.json({ error: "لا يمكنك حذف رسالة غيرك" }, { status: 403 });
  }

  const ok = await deleteCourseGroupMessageById(messageId, session.user.id);
  if (!ok) return NextResponse.json({ error: "فشل الحذف" }, { status: 500 });
  return NextResponse.json({ success: true });
}
