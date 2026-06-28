import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listStudentNotificationsForUser, markStudentNotificationsRead } from "@/lib/db";

/** قائمة إشعارات الطالب الحالي */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const notifications = await listStudentNotificationsForUser(session.user.id, 100);
  return NextResponse.json({ notifications });
}

/** تعليم الإشعارات كمقروءة */
export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  await markStudentNotificationsRead(session.user.id);
  return NextResponse.json({ ok: true });
}
