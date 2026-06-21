"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import { fillMessage } from "@/lib/i18n/interpolate";
import { RatingStarsFeedback } from "@/components/ratings/RatingStarsFeedback";

type CourseRatingSummary = {
  courseId: string;
  averageRating: number | null;
  ratingCount: number;
  userRating: number | null;
  userFeedback: string | null;
};

export function CourseRatingSection({ courseId }: { courseId: string }) {
  const t = useT();
  const [summary, setSummary] = useState<CourseRatingSummary | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/courses/${encodeURIComponent(courseId)}/rating`, { credentials: "include" })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          summary?: CourseRatingSummary;
        };
        if (!res.ok) throw new Error(data.error || t("courses.courseRatingLoadFailed", "فشل تحميل التقييم"));
        return data.summary ?? null;
      })
      .then((data) => {
        if (cancelled) return;
        setSummary(data);
        setRating(data?.userRating ?? 0);
        setFeedback(data?.userFeedback ?? "");
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t("courses.courseRatingLoadFailed", "فشل تحميل التقييم"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, t]);

  async function handleSave() {
    if (rating < 1) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, feedback }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        summary?: CourseRatingSummary;
      };
      if (!res.ok) {
        setError(data.error || t("courses.courseRatingSaveFailed", "فشل حفظ التقييم"));
        return;
      }
      if (data.summary) setSummary(data.summary);
    } catch {
      setError(t("courses.courseRatingSaveFailed", "فشل حفظ التقييم"));
    } finally {
      setBusy(false);
    }
  }

  const averageLine =
    summary?.averageRating != null && summary.ratingCount > 0
      ? fillMessage(
          t("courses.courseRatingAverageLine", "متوسط تقييم الدورة: {rating}/5 ({count} تقييم)"),
          { rating: summary.averageRating.toFixed(1), count: summary.ratingCount },
        )
      : loading
        ? t("courses.lessonRatingLoading", "جاري التحميل...")
        : t("courses.noCourseRatings", "لا توجد تقييمات للدورة بعد");

  return (
    <div className="mt-8">
      <RatingStarsFeedback
        title={t("courses.rateCourseTitle", "قيّم هذه الدورة")}
        subtitle={t("courses.rateCourseSubtitle", "شاركنا رأيك في الدورة لمساعدتنا على تحسين المحتوى.")}
        rating={rating}
        feedback={feedback}
        loading={loading}
        busy={busy}
        error={error}
        averageLine={averageLine}
        onRatingChange={setRating}
        onFeedbackChange={setFeedback}
        onSave={handleSave}
        feedbackLabel={t("courses.feedbackLabel", "ملاحظاتك (اختياري)")}
        feedbackPlaceholder={t("courses.feedbackPlaceholder", "اكتب ملاحظاتك أو اقتراحاتك...")}
        saveLabel={t("courses.saveRating", "حفظ التقييم")}
        savingLabel={t("courses.savingRating", "جاري الحفظ...")}
        rateStarsAria={(n) => t("courses.rateStarsAria", "تقييم {n} نجوم")}
      />
    </div>
  );
}
