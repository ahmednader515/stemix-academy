"use client";

import Link from "next/link";
import { useT } from "@/components/LocaleProvider";

type BeCourseCardProps = {
  course: {
    id: string;
    title: string;
    titleAr?: string | null;
    slug?: string | null;
    imageUrl?: string | null;
    price?: number | { toNumber?: () => number } | string | null;
    compareAtPrice?: number | { toNumber?: () => number } | string | null;
    category?: { name?: string; nameAr?: string | null } | null;
    instructorName?: string | null;
    institutionName?: string | null;
    chaptersCount?: number;
    lessonsCount?: number;
  };
};

function normalizePrice(price: BeCourseCardProps["course"]["price"]): number | null {
  if (price === undefined || price === null || price === "") return null;
  if (typeof price === "object" && price !== null && typeof price.toNumber === "function") {
    const n = price.toNumber();
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(price);
  return Number.isFinite(n) ? n : null;
}

function formatPrice(amount: number): string {
  const rounded = Number.isInteger(amount) ? String(amount) : amount.toFixed(0);
  return `$ ${rounded}`;
}

export function BeCourseCard({ course }: BeCourseCardProps) {
  const t = useT();
  const title = course.titleAr || course.title;
  const institution =
    course.institutionName?.trim() ||
    course.category?.nameAr?.trim() ||
    course.category?.name?.trim() ||
    null;
  const slugOrId = course.slug?.trim() ? encodeURIComponent(course.slug.trim()) : course.id;
  const href = `/courses/${slugOrId}`;
  const priceValue = normalizePrice(course.price);
  const compareValue = normalizePrice(course.compareAtPrice);
  const isFree = priceValue === null || priceValue <= 0;
  const showCompare = !isFree && compareValue !== null && compareValue > priceValue!;

  return (
    <article className="be-course-card">
      <div className="be-course-card-body">
        <Link href={href} className="be-course-card-image">
          {course.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-100 text-4xl opacity-40">📚</div>
          )}
        </Link>

        <Link href={href} className="be-course-card-title">
          {title}
        </Link>

        {course.instructorName ? (
          <p className="be-course-card-instructor">
            {t("beHome.byInstructor", "by:")} {course.instructorName}
          </p>
        ) : null}

        {institution ? <p className="be-course-card-institution">{institution}</p> : null}

        {(course.chaptersCount != null && course.chaptersCount > 0) || (course.lessonsCount != null && course.lessonsCount > 0) ? (
          <p className="be-course-card-meta text-sm text-[var(--color-muted)]">
            {course.chaptersCount != null && course.chaptersCount > 0
              ? `${course.chaptersCount} ${t("courses.chapterCountShort", "chapters")}`
              : null}
            {course.chaptersCount != null && course.chaptersCount > 0 && course.lessonsCount != null && course.lessonsCount > 0
              ? " · "
              : null}
            {course.lessonsCount != null && course.lessonsCount > 0
              ? `${course.lessonsCount} ${t("courses.lessonsCount", "lessons")}`
              : null}
          </p>
        ) : null}

        <div className="be-course-card-price">
          {isFree ? (
            <span>{t("beHome.freeSession", "Free session")}</span>
          ) : (
            <>
              <span dir="ltr">{formatPrice(priceValue!)}</span>
              {showCompare ? (
                <span className="be-course-card-price-compare" dir="ltr">
                  {formatPrice(compareValue!)}
                </span>
              ) : null}
            </>
          )}
        </div>

        <Link href={href} className="be-course-card-btn">
          {t("beHome.viewCourse", "View course")}
        </Link>
      </div>
    </article>
  );
}
