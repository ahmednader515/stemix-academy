import { BeSectionTitle } from "@/components/be-home/BeSectionTitle";
import { getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import type { Review } from "@/lib/types";

type HomeReviewsSectionProps = {
  reviews: Review[];
  title: string;
  subtitle?: string | null;
  /** When true, fits inside dashboard layout instead of full-page homepage section */
  embedded?: boolean;
};

export async function HomeReviewsSection({
  reviews,
  title,
  subtitle,
  embedded = false,
}: HomeReviewsSectionProps) {
  const t = await getServerTranslator();

  return (
    <section
      className={
        embedded
          ? "reviews-section rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-reviews-bg)] p-6 shadow-[var(--shadow-card)] sm:p-8"
          : "reviews-section border-t border-[var(--color-border)] bg-[var(--color-reviews-bg)] px-2 py-14 sm:px-6 sm:py-16"
      }
    >
      <div className={embedded ? undefined : "mx-auto max-w-6xl"}>
        <BeSectionTitle className={embedded ? "text-center" : undefined}>{title}</BeSectionTitle>
        {subtitle ? (
          <p className={`mt-3 text-center text-[var(--color-muted)] ${embedded ? "" : "px-2 sm:px-0"}`}>
            {subtitle}
          </p>
        ) : null}
        {reviews.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            {reviews.map((r) => {
              const authorName = r.authorName?.trim() ?? "";
              const letter = (r.avatarLetter && r.avatarLetter.trim()) || (authorName[0] ?? "");
              const reviewText = pickLocalizedText(r.text, r.textEn)?.trim() ?? "";
              const reviewAuthorTitle = pickLocalizedText(r.authorTitle, r.authorTitleEn)?.trim() ?? "";
              const showAuthorBlock = !!(letter || authorName || reviewAuthorTitle);
              const showText = !!reviewText;
              const isImageOnly = !!r.imageUrl && !showAuthorBlock && !showText;
              const imageAlt = authorName
                ? `${t("home.reviewImageAltPrefix", "Review image from")} ${authorName}`
                : t("home.reviewImageAlt", "Student review image");

              return (
                <div
                  key={r.id}
                  className={
                    isImageOnly
                      ? "w-full rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-card)] sm:p-1.5"
                      : "rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]"
                  }
                >
                  {showAuthorBlock ? (
                    <div className="flex items-start gap-3">
                      {letter ? (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-reviews-avatar)] text-lg font-semibold text-[var(--color-muted)]">
                          {letter}
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        {authorName ? (
                          <p className="text-sm font-medium text-[var(--color-primary)]">{authorName}</p>
                        ) : null}
                        {reviewAuthorTitle ? (
                          <p className="mt-0.5 text-xs text-[var(--color-muted)]">{reviewAuthorTitle}</p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  {showText ? (
                    <p
                      className={
                        showAuthorBlock
                          ? "mt-4 text-[var(--color-foreground)]"
                          : "text-[var(--color-foreground)]"
                      }
                    >
                      {reviewText}
                    </p>
                  ) : null}
                  {r.imageUrl ? (
                    <div
                      className={
                        isImageOnly
                          ? "flex w-full items-center justify-center overflow-hidden rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-black/5 sm:min-h-[22rem]"
                          : showAuthorBlock || showText
                            ? "mt-4 overflow-hidden rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-black/5 p-2"
                            : "overflow-hidden rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-black/5 p-2"
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.imageUrl}
                        alt={imageAlt}
                        loading="lazy"
                        className={
                          isImageOnly
                            ? "h-auto w-full max-h-96 object-contain sm:max-h-[32rem] sm:min-h-[20rem]"
                            : "h-auto max-h-72 w-full object-contain"
                        }
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-8 text-center text-[var(--be-muted)]">{t("home.noReviewsYet", "No reviews yet.")}</p>
        )}
      </div>
    </section>
  );
}
