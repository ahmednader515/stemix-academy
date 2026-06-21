import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCourseRequest } from "@/lib/db";
import { isValidEgyptWhatsapp, normalizeEgyptWhatsapp } from "@/lib/whatsapp-phone";

/** إرسال طلب دورة من الطالب */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  let body: {
    studentName?: string;
    studentEmail?: string;
    studentPhone?: string;
    studentWhatsapp?: string;
    courseTitle?: string;
    courseSubject?: string;
    courseDescription?: string;
    additionalNotes?: string;
    attachments?: Array<{ fileUrl?: string; fileName?: string; fileType?: string }>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const studentName = body.studentName?.trim() ?? "";
  const studentEmail = body.studentEmail?.trim() ?? "";
  const studentPhone = body.studentPhone?.trim() ?? "";
  const studentWhatsappRaw = body.studentWhatsapp?.trim() ?? "";
  const courseTitle = body.courseTitle?.trim() ?? "";
  const courseDescription = body.courseDescription?.trim() ?? "";

  if (!studentName) {
    return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
  }
  if (!studentEmail || !studentEmail.includes("@")) {
    return NextResponse.json({ error: "البريد الإلكتروني غير صالح" }, { status: 400 });
  }
  const phoneDigits = studentPhone.replace(/\D/g, "");
  if (phoneDigits.length !== 11) {
    return NextResponse.json({ error: "رقم الهاتف يجب أن يكون 11 رقماً" }, { status: 400 });
  }
  if (!isValidEgyptWhatsapp(studentWhatsappRaw)) {
    return NextResponse.json(
      { error: "رقم الواتساب يجب أن يبدأ بـ 20 ويتكون من 12 رقماً (مثال: 201012345678)" },
      { status: 400 },
    );
  }
  const studentWhatsapp = normalizeEgyptWhatsapp(studentWhatsappRaw);
  if (!studentWhatsapp) {
    return NextResponse.json({ error: "رقم الواتساب غير صالح" }, { status: 400 });
  }
  if (!courseTitle) {
    return NextResponse.json({ error: "اسم الدورة المطلوبة مطلوب" }, { status: 400 });
  }
  if (!courseDescription) {
    return NextResponse.json({ error: "وصف الدورة مطلوب" }, { status: 400 });
  }

  const attachments = (body.attachments ?? [])
    .filter((a) => a.fileUrl?.trim())
    .map((a) => ({
      file_url: a.fileUrl!.trim(),
      file_name: a.fileName?.trim() || null,
      file_type: a.fileType === "pdf" ? ("pdf" as const) : ("image" as const),
    }));

  try {
    const created = await createCourseRequest({
      user_id: session.user.id,
      student_name: studentName,
      student_email: studentEmail,
      student_phone: phoneDigits,
      student_whatsapp: studentWhatsapp,
      course_title: courseTitle,
      course_subject: body.courseSubject?.trim() || null,
      course_description: courseDescription,
      additional_notes: body.additionalNotes?.trim() || null,
      attachments,
    });
    return NextResponse.json({ success: true, id: created.id });
  } catch (e) {
    console.error("createCourseRequest error:", e);
    return NextResponse.json({ error: "فشل إرسال الطلب" }, { status: 500 });
  }
}
