import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  listCourseGroupMessages,
  createCourseGroupMessage,
  getUserById,
} from "@/lib/db";
import {
  getCourseChatAccess,
  serializeGroupMessage,
} from "@/lib/course-chat-access";

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
  if (!access?.canGroupChat) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const since = parseSince(request.nextUrl.searchParams.get("since"));
  try {
    const messages = await listCourseGroupMessages(courseId, { since, limit: 150 });
    return NextResponse.json(messages.map(serializeGroupMessage));
  } catch (e) {
    console.error("listCourseGroupMessages error:", e);
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
  if (!access?.canGroupChat) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  let body: { type?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  if (body.type !== "text") {
    return NextResponse.json({ error: "الرسائل النصية فقط مدعومة" }, { status: 400 });
  }

  const content = body.content?.trim();
  if (!content) return NextResponse.json({ error: "النص مطلوب" }, { status: 400 });

  try {
    const created = await createCourseGroupMessage({
      course_id: courseId,
      sender_id: session.user.id,
      message_type: "text",
      content,
    });
    const user = await getUserById(session.user.id);
    return NextResponse.json(
      serializeGroupMessage({ ...created, senderName: user?.name ?? session.user.name ?? "" }),
    );
  } catch (e) {
    console.error("createCourseGroupMessage error:", e);
    return NextResponse.json({ error: "فشل إرسال الرسالة" }, { status: 500 });
  }
}
