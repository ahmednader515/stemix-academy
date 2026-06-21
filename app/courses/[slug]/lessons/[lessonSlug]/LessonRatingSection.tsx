"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import { fillMessage } from "@/lib/i18n/interpolate";
import { RatingStarsFeedback } from "@/components/ratings/RatingStarsFeedback";

type RatingSummary = {
  lessonId: string;
  courseId: string;
  averageRating: number | null;
  ratingCount: number;
  courseAverageRating: number | null;
  courseRatingCount: number;
  userRating: number | null;
  userFeedback: string | null;
};

export function LessonRatingSection({ lessonId }: { lessonId: string }) {
  const t = useT();
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/lessons/${encodeURIComponent(lessonId)}/rating`, { credentials: "include" })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { error?: string; summary?: RatingSummary };
        if (!res.ok) throw new Error(data.error || t("courses.lessonRatingLoadFailed", "Failed to load ratings"));
        return data.summary ?? null;
      })
      .then((data) => {
        if (!cancelled) {
          setSummary(data);
          setRating(data?.userRating ?? 0);
          setFeedback(data?.userFeedback ?? "");
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t("courses.lessonRatingLoadFailed", "Failed to load ratings"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId, t]);

  async function handleSave() {
    if (rating < 1) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/lessons/${encodeURIComponent(lessonId)}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, feedback }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; summary?: RatingSummary };
      if (!res.ok) {
        setError(data.error || t("courses.lessonRatingSaveFailed", "Failed to save your rating"));
        return;
      }
      if (data.summary) setSummary(data.summary);
    } catch {
      setError(t("courses.lessonRatingSaveFailed", "Failed to save your rating"));
    } finally {
      setBusy(false);
    }
  }

  const lines: string[] = [];
  if (loading) {
    lines.push(t("courses.lessonRatingLoading", "Loading ratings..."));
  } else {
    if (summary?.averageRating != null && summary.ratingCount > 0) {
      lines.push(
        fillMessage(
          t("courses.lessonRatingAverageLine", "Lesson rating: {rating}/5 ({count} ratings)"),
          { rating: summary.averageRating.toFixed(1), count: summary.ratingCount },
        ),
      );
    } else {
      lines.push(t("courses.noRatings", "No ratings yet"));
    }
    if (summary?.courseAverageRating != null && summary.courseRatingCount > 0) {
      lines.push(
        fillMessage(
          t("courses.courseRatingAverageLine", "Course rating (all lessons): {rating}/5 ({count} ratings)"),
          { rating: summary.courseAverageRating.toFixed(1), count: summary.courseRatingCount },
        ),
      );
    }
  }

  return (
    <div className="mt-6">
      <RatingStarsFeedback
        title={t("courses.rateLessonTitle", "Rate this lesson")}
        subtitle={t("courses.rateLessonSubtitle", "Your rating helps improve course quality for everyone.")}
        rating={rating}
        feedback={feedback}
        loading={loading}
        busy={busy}
        error={error}
        averageLine={lines.join(" · ")}
        onRatingChange={setRating}
        onFeedbackChange={setFeedback}
        onSave={handleSave}
        feedbackLabel={t("courses.feedbackLabel", "ملاحظاتك (اختياري)")}
        feedbackPlaceholder={t("courses.feedbackPlaceholder", "اكتب ملاحظاتك أو اقتراحاتك...")}
        saveLabel={t("courses.saveRating", "حفظ التقييم")}
        savingLabel={t("courses.savingRating", "جاري الحفظ...")}
        rateStarsAria={(n) => t("courses.rateStarsAria", "Rate {n} stars")}
      />
    </div>
  );
}
