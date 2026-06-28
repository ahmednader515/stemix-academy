import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSubscriptionPlan, listSubscriptionPlansAll } from "@/lib/db";
import type { SubscriptionDurationKind, SubscriptionExpiryMode } from "@/lib/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const plans = await listSubscriptionPlansAll();
    return NextResponse.json({ plans });
  } catch (e) {
    console.error("GET subscription-plans", e);
    return NextResponse.json({ error: "فشل جلب الباقات" }, { status: 500 });
  }
}

function parseExpiryMode(value: unknown): SubscriptionExpiryMode | null {
  if (value === "fixed_date") return "fixed_date";
  if (value === "duration") return "duration";
  return null;
}

function parseCourseIds(value: unknown): string[] | null {
  if (value === undefined) return null;
  if (!Array.isArray(value)) return null;
  return value.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: {
    name?: string;
    description?: string;
    imageUrl?: string | null;
    durationKind?: string;
    expiryMode?: string;
    fixedExpiresAt?: string | null;
    courseIds?: unknown;
    price?: number;
    isActive?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "اسم الاشتراك مطلوب" }, { status: 400 });

  const expiryMode = parseExpiryMode(body.expiryMode) ?? "duration";
  const dk = body.durationKind as SubscriptionDurationKind | undefined;
  const durationKind: SubscriptionDurationKind =
    dk === "week" || dk === "month" || dk === "year" ? dk : "month";

  if (expiryMode === "duration" && dk !== "week" && dk !== "month" && dk !== "year") {
    return NextResponse.json({ error: "اختر مدة: week أو month أو year" }, { status: 400 });
  }

  if (expiryMode === "fixed_date") {
    if (!body.fixedExpiresAt?.trim()) {
      return NextResponse.json({ error: "حدّد تاريخ انتهاء للباقة" }, { status: 400 });
    }
    const fixed = new Date(body.fixedExpiresAt);
    if (Number.isNaN(fixed.getTime())) {
      return NextResponse.json({ error: "تاريخ انتهاء غير صالح" }, { status: 400 });
    }
    if (fixed <= new Date()) {
      return NextResponse.json({ error: "تاريخ الانتهاء يجب أن يكون في المستقبل" }, { status: 400 });
    }
  }

  const courseIds = parseCourseIds(body.courseIds);
  if (body.courseIds !== undefined && courseIds === null) {
    return NextResponse.json({ error: "قائمة الدورات غير صالحة" }, { status: 400 });
  }

  const price = typeof body.price === "number" && Number.isFinite(body.price) ? Math.max(0, body.price) : 0;
  try {
    const { id } = await createSubscriptionPlan({
      name,
      description: body.description?.trim() ?? "",
      image_url: body.imageUrl?.trim() || null,
      duration_kind: durationKind,
      expiry_mode: expiryMode,
      fixed_expires_at: expiryMode === "fixed_date" ? body.fixedExpiresAt : null,
      course_ids: courseIds ?? [],
      price,
      is_active: body.isActive !== false,
    });
    return NextResponse.json({ success: true, id });
  } catch (e) {
    console.error("POST subscription-plans", e);
    const msg = e instanceof Error ? e.message : "فشل إنشاء الباقة";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
