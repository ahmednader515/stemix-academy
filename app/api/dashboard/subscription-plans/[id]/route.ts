import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteSubscriptionPlan, updateSubscriptionPlan } from "@/lib/db";
import type { SubscriptionDurationKind, SubscriptionExpiryMode } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

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

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
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

  const patch: Parameters<typeof updateSubscriptionPlan>[1] = {};
  if (body.name !== undefined) patch.name = body.name.trim();
  if (body.description !== undefined) patch.description = body.description.trim();
  if (body.imageUrl !== undefined) patch.image_url = body.imageUrl?.trim() || null;
  if (body.durationKind !== undefined) {
    const dk = body.durationKind as SubscriptionDurationKind;
    if (dk !== "week" && dk !== "month" && dk !== "year") {
      return NextResponse.json({ error: "مدة غير صالحة" }, { status: 400 });
    }
    patch.duration_kind = dk;
  }
  if (body.expiryMode !== undefined) {
    const mode = parseExpiryMode(body.expiryMode);
    if (!mode) return NextResponse.json({ error: "نوع انتهاء غير صالح" }, { status: 400 });
    patch.expiry_mode = mode;
  }
  if (body.fixedExpiresAt !== undefined) {
    if (body.fixedExpiresAt === null || body.fixedExpiresAt === "") {
      patch.fixed_expires_at = null;
    } else {
      const fixed = new Date(body.fixedExpiresAt);
      if (Number.isNaN(fixed.getTime())) {
        return NextResponse.json({ error: "تاريخ انتهاء غير صالح" }, { status: 400 });
      }
      if (fixed <= new Date()) {
        return NextResponse.json({ error: "تاريخ الانتهاء يجب أن يكون في المستقبل" }, { status: 400 });
      }
      patch.fixed_expires_at = fixed;
    }
  }
  const courseIds = parseCourseIds(body.courseIds);
  if (body.courseIds !== undefined && courseIds === null) {
    return NextResponse.json({ error: "قائمة الدورات غير صالحة" }, { status: 400 });
  }
  if (courseIds !== null) patch.course_ids = courseIds;
  if (body.price !== undefined) patch.price = Math.max(0, Number(body.price) || 0);
  if (body.isActive !== undefined) patch.is_active = !!body.isActive;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "لا توجد حقول للتحديث" }, { status: 400 });
  }

  try {
    await updateSubscriptionPlan(id, patch);
  } catch (e) {
    console.error("PATCH subscription-plans/[id]", e);
    const msg = e instanceof Error ? e.message : "فشل التحديث";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  try {
    await deleteSubscriptionPlan(id);
  } catch (e) {
    console.error("DELETE subscription-plans/[id]", e);
    return NextResponse.json({ error: "تعذر الحذف — قد تكون الباقة مرتبطة بسجلات" }, { status: 409 });
  }
  return NextResponse.json({ success: true });
}
