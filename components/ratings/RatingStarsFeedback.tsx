"use client";

import { fillMessage } from "@/lib/i18n/interpolate";

type Props = {
  title: string;
  subtitle?: string;
  rating: number;
  feedback: string;
  loading?: boolean;
  busy?: boolean;
  error?: string | null;
  averageLine?: string | null;
  onRatingChange: (value: number) => void;
  onFeedbackChange: (value: string) => void;
  onSave: () => void;
  feedbackLabel: string;
  feedbackPlaceholder: string;
  saveLabel: string;
  savingLabel: string;
  rateStarsAria: (n: number) => string;
};

export function RatingStarsFeedback({
  title,
  subtitle,
  rating,
  feedback,
  loading = false,
  busy = false,
  error,
  averageLine,
  onRatingChange,
  onFeedbackChange,
  onSave,
  feedbackLabel,
  feedbackPlaceholder,
  saveLabel,
  savingLabel,
  rateStarsAria,
}: Props) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] sm:p-5">
      <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h3>
      {subtitle ? (
        <p className="mt-1 text-xs text-[var(--color-muted)]">{subtitle}</p>
      ) : null}

      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => {
          const selected = rating >= value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onRatingChange(value)}
              disabled={busy || loading}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-2xl leading-none transition ${
                selected
                  ? "border-amber-500 bg-amber-500/15 text-amber-500"
                  : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted)]"
              } disabled:opacity-60`}
              aria-label={fillMessage(rateStarsAria(value), { n: value })}
            >
              ★
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <label className="block text-xs font-medium text-[var(--color-foreground)]">
          {feedbackLabel}
        </label>
        <textarea
          value={feedback}
          onChange={(e) => onFeedbackChange(e.target.value)}
          rows={3}
          placeholder={feedbackPlaceholder}
          disabled={busy || loading}
          className="mt-1 w-full resize-none rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)] disabled:opacity-60"
        />
      </div>

      {error ? (
        <p className="mt-3 rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      ) : null}

      {averageLine ? (
        <p className="mt-3 text-xs text-[var(--color-muted)]">{averageLine}</p>
      ) : null}

      <button
        type="button"
        onClick={onSave}
        disabled={busy || loading || rating < 1}
        className="mt-4 rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
      >
        {busy ? savingLabel : saveLabel}
      </button>
    </section>
  );
}
