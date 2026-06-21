import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getOrCreateCoursePrivateConversation,
  listCoursePrivateMessages,
  createCoursePrivateMessage,
  getUserById,
  getCoursePrivateConversationById,
} from "@/lib/db";
import {
  getCourseChatAccess,
  canAccessPrivateConversation,
  serializePrivateMessage,
  studentNameOnly,
} from "@/lib/course-chat-access";
import type { UserRole } from "@/lib/types";

type RouteParams = { params: Promise<{ id: string }> };

function parseSince(value: string | null): Date | null {
  if (!value?.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id: courseId } = await params;
  const access = await getCourseChatAccess(courseId, session);
  if (!access?.createdById) {
    return NextResponse.json({ error: "لا يوجد منشئ للدورة" }, { status: 400 });
  }

  const role = session.user.role;
  let conversationId: string | null = request.nextUrl.searchParams.get("conversationId");

  if (role === "STUDENT") {
    if (!access.canPrivateChatStudent) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    const conv = await getOrCreateCoursePrivateConversation(courseId, access.createdById, session.user.id);
    conversationId = conv.id;
  } else {
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId مطلوب" }, { status: 400 });
    }
    const conv = await getCoursePrivateConversationById(conversationId);
    if (!conv || conv.course_id !== courseId) {
      return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });
    }
    if (!canAccessPrivateConversation(role as UserRole, session.user.id, conv)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
  }

  const since = parseSince(request.nextUrl.searchParams.get("since"));
  try {
    const messages = await listCoursePrivateMessages(conversationId!, { since, limit: 150 });
    const serialized = messages.map(serializePrivateMessage);

    if (role === "STUDENT") {
      return NextResponse.json({ conversationId, messages: serialized });
    }

    const convRow = await getCoursePrivateConversationById(conversationId!);
    const student = convRow ? await getUserById(convRow.student_user_id) : null;
    return NextResponse.json({
      conversationId,
      student: studentNameOnly(student?.name ?? ""),
      messages: serialized,
    });
  } catch (e) {
    console.error("listCoursePrivateMessages error:", e);
    return NextResponse.json({ error: "فشل تحميل الرسائل" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id: courseId } = await params;
  const access = await getCourseChatAccess(courseId, session);
  if (!access?.createdById) {
    return NextResponse.json({ error: "لا يوجد منشئ للدورة" }, { status: 400 });
  }

  let body: {
    type?: string;
    content?: string;
    conversationId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const role = session.user.role;
  let conv: Awaited<ReturnType<typeof getOrCreateCoursePrivateConversation>>;

  if (role === "STUDENT") {
    if (!access.canPrivateChatStudent) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    conv = await getOrCreateCoursePrivateConversation(courseId, access.createdById, session.user.id);
  } else {
    const conversationId = body.conversationId?.trim();
    if (!conversationId) return NextResponse.json({ error: "conversationId مطلوب" }, { status: 400 });
    const existing = await getCoursePrivateConversationById(conversationId);
    if (!existing || existing.course_id !== courseId) {
      return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });
    }
    if (!canAccessPrivateConversation(role as UserRole, session.user.id, existing)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    conv = existing;
  }

  if (body.type !== "text") {
    return NextResponse.json({ error: "الرسائل النصية فقط مدعومة" }, { status: 400 });
  }

  const content = body.content?.trim();
  if (!content) return NextResponse.json({ error: "النص مطلوب" }, { status: 400 });

  try {
    const created = await createCoursePrivateMessage({
      conversation_id: conv.id,
      sender_id: session.user.id,
      message_type: "text",
      content,
    });
    const user = await getUserById(session.user.id);
    return NextResponse.json({
      conversationId: conv.id,
      message: serializePrivateMessage({ ...created, senderName: user?.name ?? session.user.name ?? "" }),
    });
  } catch (e) {
    console.error("createCoursePrivateMessage error:", e);
    return NextResponse.json({ error: "فشل إرسال الرسالة" }, { status: 500 });
  }
}
