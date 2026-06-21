import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { getHomepageSettings } from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator();
  return {
    title: `${t("legal.privacy.title", "سياسة الخصوصية")} | ${t("footer.defaultTitle", "منصتي التعليمية")}`,
    description: t(
      "legal.privacy.metaDescription",
      "تعرف على كيفية جمع واستخدام وحماية بياناتك الشخصية على المنصة.",
    ),
  };
}

export default async function PrivacyPolicyPage() {
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
      title={t("legal.privacy.title", "سياسة الخصوصية")}
      intro={t(
        "legal.privacy.intro",
        "توضّح هذه السياسة كيفية تعامل {platform} مع بياناتك الشخصية عند استخدامك للمنصة.",
      ).replace("{platform}", platformName)}
      updatedLabel={t("legal.lastUpdated", "آخر تحديث")}
      updatedDate={updatedDate}
      backLabel={t("common.home", "الرئيسية")}
      sections={[
        {
          title: t("legal.privacy.s1Title", "1. البيانات التي نجمعها"),
          paragraphs: [
            t(
              "legal.privacy.s1p1",
              "قد نجمع البيانات التالية عند التسجيل أو استخدام المنصة:",
            ),
          ],
          list: [
            t("legal.privacy.s1l1", "الاسم والبريد الإلكتروني ورقم الهاتف ورقم الواتساب."),
            t("legal.privacy.s1l2", "بيانات الحساب مثل كلمة المرور (مخزّنة بشكل مشفّر)."),
            t("legal.privacy.s1l3", "سجل التسجيل في الدورات والاشتراكات والمشتريات."),
            t("legal.privacy.s1l4", "التفاعلات داخل المنصة مثل الرسائل والواجبات والمحادثات."),
            t("legal.privacy.s1l5", "بيانات تقنية أساسية مثل عنوان IP ونوع المتصفح لأغراض الأمان."),
          ],
        },
        {
          title: t("legal.privacy.s2Title", "2. كيفية استخدام البيانات"),
          paragraphs: [
            t(
              "legal.privacy.s2p1",
              "نستخدم بياناتك لتقديم خدمات المنصة وإدارة حسابك، بما في ذلك:",
            ),
          ],
          list: [
            t("legal.privacy.s2l1", "إنشاء حسابك وتسجيل دخولك."),
            t("legal.privacy.s2l2", "تفعيل الوصول إلى الدورات والاشتراكات وأكواد التفعيل."),
            t("legal.privacy.s2l3", "التواصل معك بخصوص الدعم الفني أو طلباتك."),
            t("legal.privacy.s2l4", "تحسين تجربة التعلم وحماية المنصة من إساءة الاستخدام."),
          ],
        },
        {
          title: t("legal.privacy.s3Title", "3. مشاركة البيانات"),
          paragraphs: [
            t(
              "legal.privacy.s3p1",
              "لا نبيع بياناتك الشخصية. قد نشارك بيانات محدودة فقط عند الحاجة مع مزودي خدمات موثوقين (مثل الاستضافة والتخزين السحابي) أو عند الالتزام بأمر قضائي.",
            ),
            t(
              "legal.privacy.s3p2",
              "قد يرى المدرسون أو فريق الإدارة بيانات ضرورية لتقديم الدورة أو الدعم، وفق صلاحيات كل دور على المنصة.",
            ),
          ],
        },
        {
          title: t("legal.privacy.s4Title", "4. حفظ البيانات والأمان"),
          paragraphs: [
            t(
              "legal.privacy.s4p1",
              "نطبّق إجراءات أمنية معقولة لحماية بياناتك من الوصول غير المصرح به أو التعديل أو الإفشاء.",
            ),
            t(
              "legal.privacy.s4p2",
              "نحتفظ ببياناتك طالما كان حسابك نشطاً أو حسب ما تقتضيه المتطلبات التشغيلية والقانونية.",
            ),
          ],
        },
        {
          title: t("legal.privacy.s5Title", "5. حقوقك"),
          paragraphs: [
            t(
              "legal.privacy.s5p1",
              "يمكنك طلب تحديث بيانات حسابك من صفحة الملف الشخصي، أو التواصل معنا لطلب تصحيح أو حذف بياناتك ضمن ما يسمح به النظام والقانون.",
            ),
          ],
        },
        {
          title: t("legal.privacy.s6Title", "6. ملفات تعريف الارتباط"),
          paragraphs: [
            t(
              "legal.privacy.s6p1",
              "نستخدم ملفات تعريف الارتباط والتخزين المحلي اللازمة لتشغيل الجلسة وتذكّر تفضيلاتك. يمكنك ضبط متصفحك لرفض بعض ملفات تعريف الارتباط، لكن ذلك قد يؤثر على بعض وظائف المنصة.",
            ),
          ],
        },
        {
          title: t("legal.privacy.s7Title", "7. تحديث هذه السياسة"),
          paragraphs: [
            t(
              "legal.privacy.s7p1",
              "قد نحدّث هذه السياسة من وقت لآخر. يُعد استمرارك في استخدام المنصة بعد التحديث موافقة على النسخة المعدّلة.",
            ),
          ],
        },
        {
          title: t("legal.privacy.s8Title", "8. التواصل"),
          paragraphs: [
            t(
              "legal.privacy.s8p1",
              "لأي استفسار حول الخصوصية، تواصل معنا عبر قنوات الدعم المتاحة في المنصة (مثل واتساب الدعم إن وُجد).",
            ),
          ],
        },
      ]}
    />
  );
}
