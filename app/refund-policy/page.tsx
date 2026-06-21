import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { getHomepageSettings } from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator();
  return {
    title: `${t("legal.refund.title", "سياسة الاسترداد")} | ${t("footer.defaultTitle", "منصتي التعليمية")}`,
    description: t(
      "legal.refund.metaDescription",
      "تعرف على شروط وإجراءات استرداد المبالغ للدورات والاشتراكات على المنصة.",
    ),
  };
}

export default async function RefundPolicyPage() {
  const t = await getServerTranslator();
  let platformName = t("footer.defaultTitle", "منصتي التعليمية");
  try {
    const settings = await getHomepageSettings();
    platformName =
      pickLocalizedText(settings.platformName, settings.platformNameEn)?.trim() || platformName;
  } catch {
    /* use default */
  }

  const updatedDate = new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date("2026-06-21"));

  return (
    <LegalPageLayout
      title={t("legal.refund.title", "سياسة الاسترداد")}
      intro={t(
        "legal.refund.intro",
        "توضّح هذه السياسة شروط استرداد المبالغ المدفوعة على {platform} للدورات والاشتراكات والمنتجات الرقمية.",
      ).replace("{platform}", platformName)}
      updatedLabel={t("legal.lastUpdated", "آخر تحديث")}
      updatedDate={updatedDate}
      backLabel={t("common.home", "الرئيسية")}
      sections={[
        {
          title: t("legal.refund.s1Title", "1. نطاق السياسة"),
          paragraphs: [
            t(
              "legal.refund.s1p1",
              "تنطبق هذه السياسة على المشتريات الرقمية عبر المنصة، بما في ذلك الدورات المدفوعة واشتراكات المنصة وأكواد التفعيل والمنتجات الرقمية في المتجر.",
            ),
          ],
        },
        {
          title: t("legal.refund.s2Title", "2. الدورات المدفوعة"),
          paragraphs: [
            t(
              "legal.refund.s2p1",
              "نظراً لطبيعة المحتوى الرقمي، لا يُسمح بالاسترداد بعد تفعيل الوصول الكامل للدورة أو مشاهدة جزء جوهري من محتواها.",
            ),
            t(
              "legal.refund.s2p2",
              "قد يُنظر في طلب الاسترداد خلال 24 ساعة من الشراء إذا لم يتم استخدام الدورة أو تفعيل الوصول إليها.",
            ),
          ],
        },
        {
          title: t("legal.refund.s3Title", "3. اشتراكات المنصة"),
          paragraphs: [
            t(
              "legal.refund.s3p1",
              "الاشتراكات الشهرية أو الموسمية غير قابلة للاسترداد بعد بدء فترة الاشتراك، إلا في حال وجود خطأ تقني من جانب المنصة منعك من الاستفادة من الخدمة.",
            ),
          ],
        },
        {
          title: t("legal.refund.s4Title", "4. أكواد التفعيل"),
          paragraphs: [
            t(
              "legal.refund.s4p1",
              "أكواد التفعيل المستخدمة أو المفعّلة على حساب لا يمكن استرداد قيمتها. الأكواد غير المستخدمة قد تُستبدل أو تُسترد وفق تقدير الإدارة.",
            ),
          ],
        },
        {
          title: t("legal.refund.s5Title", "5. كيفية تقديم طلب الاسترداد"),
          paragraphs: [
            t(
              "legal.refund.s5p1",
              "لتقديم طلب استرداد، تواصل مع فريق الدعم عبر قنوات المنصة (مثل واتساب الدعم) مع ذكر:",
            ),
          ],
          list: [
            t("legal.refund.s5l1", "اسم الحساب والبريد الإلكتروني المسجّل."),
            t("legal.refund.s5l2", "اسم الدورة أو الاشتراك أو المنتج."),
            t("legal.refund.s5l3", "تاريخ الشراء وطريقة الدفع."),
            t("legal.refund.s5l4", "سبب طلب الاسترداد."),
          ],
        },
        {
          title: t("legal.refund.s6Title", "6. حالات غير قابلة للاسترداد"),
          paragraphs: [],
          list: [
            t("legal.refund.s6l1", "المحتوى الذي تم الوصول إليه أو تحميله بشكل كامل."),
            t("legal.refund.s6l2", "الاشتراكات بعد انتهاء فترة السماح أو بعد الاستخدام الفعلي."),
            t("legal.refund.s6l3", "المشتريات الناتجة عن مخالفة شروط الاستخدام أو إساءة استخدام المنصة."),
            t("legal.refund.s6l4", "العروض المجانية أو التجريبية."),
          ],
        },
        {
          title: t("legal.refund.s7Title", "7. مدة معالجة الطلب"),
          paragraphs: [
            t(
              "legal.refund.s7p1",
              "تُراجع الطلبات خلال 3–7 أيام عمل. في حال الموافقة، يُعاد المبلغ إلى رصيد الحساب على المنصة أو بوسيلة الدفع الأصلية حسب ما تسمح به إجراءات الدفع.",
            ),
          ],
        },
        {
          title: t("legal.refund.s8Title", "8. التواصل"),
          paragraphs: [
            t(
              "legal.refund.s8p1",
              "لأي استفسار حول الاسترداد، تواصل معنا عبر قنوات الدعم المتاحة في المنصة.",
            ),
          ],
        },
      ]}
    />
  );
}
