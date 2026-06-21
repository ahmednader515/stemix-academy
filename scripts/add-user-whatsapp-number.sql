-- إضافة عمود رقم واتساب الطالب (صيغة دولية مصر: 20XXXXXXXXXX)
-- شغّله من لوحة Neon → SQL Editor إذا كان العمود غير موجود

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
