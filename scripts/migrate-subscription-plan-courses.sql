-- اشتراكات: دورات محددة لكل باقة + تاريخ انتهاء ثابت
-- شغّل في Neon SQL Editor على قواعد بيانات موجودة

ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS expiry_mode TEXT NOT NULL DEFAULT 'duration';
ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS fixed_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS "SubscriptionPlanCourse" (
  plan_id   TEXT NOT NULL REFERENCES "SubscriptionPlan"(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  PRIMARY KEY (plan_id, course_id)
);
CREATE INDEX IF NOT EXISTS "SubscriptionPlanCourse_course_idx" ON "SubscriptionPlanCourse"(course_id);
