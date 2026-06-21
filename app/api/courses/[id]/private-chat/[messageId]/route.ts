import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  deleteCoursePrivateMessageById,
  getCoursePrivateMessageById,
  getCoursePrivateConversationById,
} from "@/lib/db";
import { canAccessPrivateConversation } from "@/lib/course-chat-access";
import type { UserRole } from "@/lib/types";

type RouteParams = { params: Promise<{ id: string; messageId: string }> };

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id: courseId, messageId } = await params;

  const msg = await getCoursePrivateMessageById(messageId);
  if (!msg) return NextResponse.json({ error: "الرسالة غير موجودة" }, { status: 404 });

  const conv = await getCoursePrivateConversationById(msg.conversation_id);
  if (!conv || conv.course_id !== courseId) {
    return NextResponse.json({ error: "الرسالة غير موجودة" }, { status: 404 });
  }
  if (!canAccessPrivateConversation(session.user.role as UserRole, session.user.id, conv)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  if (msg.sender_id !== session.user.id) {
    return NextResponse.json({ error: "لا يمكنك حذف رسالة غيرك" }, { status: 403 });
  }

  const ok = await deleteCoursePrivateMessageById(messageId, session.user.id);
  if (!ok) return NextResponse.json({ error: "فشل الحذف" }, { status: 500 });
  return NextResponse.json({ success: true });
}
