import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createStudentNotificationsBulk,
  getStudentsEnrolledInTeacherCourses,
  getUserById,
} from "@/lib/db";
import type { UserRole } from "@/lib/types";

/** إرسال إشعار داخل التطبيق لعدة طلاب */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const role = session.user.role as UserRole;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  let body: { studentIds?: string[]; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const message = body.message?.trim() ?? "";
  if (!message) {
    return NextResponse.json({ error: "نص الرسالة مطلوب" }, { status: 400 });
  }

  const rawIds = Array.isArray(body.studentIds) ? body.studentIds : [];
  const studentIds = [...new Set(rawIds.map((id) => String(id).trim()).filter(Boolean))];
  if (studentIds.length === 0) {
    return NextResponse.json({ error: "اختر طالباً واحداً على الأقل" }, { status: 400 });
  }

  let allowedIds = studentIds;
  if (role === "TEACHER") {
    const enrolled = await getStudentsEnrolledInTeacherCourses(session.user.id);
    const enrolledSet = new Set(enrolled.map((u) => u.id));
    allowedIds = studentIds.filter((id) => enrolledSet.has(id));
    if (allowedIds.length === 0) {
      return NextResponse.json({ error: "لا يمكن إرسال إشعار لهؤلاء الطلاب" }, { status: 403 });
    }
  } else {
    const valid: string[] = [];
    for (const id of studentIds) {
      const u = await getUserById(id);
      if (u?.role === "STUDENT") valid.push(id);
    }
    allowedIds = valid;
    if (allowedIds.length === 0) {
      return NextResponse.json({ error: "لا يوجد طلاب صالحون في القائمة" }, { status: 400 });
    }
  }

  const sent = await createStudentNotificationsBulk(session.user.id, allowedIds, message);
  return NextResponse.json({ sent, skipped: studentIds.length - allowedIds.length });
}
