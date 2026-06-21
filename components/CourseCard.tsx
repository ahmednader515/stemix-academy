"use client";

import { BeCourseCard } from "@/components/be-home/BeCourseCard";

function normalizeCoursePrice(
  price: number | { toNumber?: () => number } | string | undefined | null,
): number | null {
  if (price === undefined || price === null || price === "") return null;
  if (typeof price === "object" && price !== null && typeof price.toNumber === "function") {
    const n = price.toNumber();
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(price);
  return Number.isFinite(n) ? n : null;
}

type Course = {
  id: string;
  title: string;
  titleAr?: string | null;
  slug?: string | null;
  imageUrl?: string | null;
  price?: number | { toNumber?: () => number } | string | null;
  compareAtPrice?: number | { toNumber?: () => number } | string | null;
  category?: { name: string; nameAr?: string | null } | null;
  instructorName?: string | null;
  creatorName?: string | null;
  institutionName?: string | null;
};

export function CourseCard({ course }: { course: Course }) {
  const categoryLabel = course.category?.nameAr?.trim() || course.category?.name?.trim() || null;
  return (
    <BeCourseCard
      course={{
        id: course.id,
        title: course.title,
        titleAr: course.titleAr,
        slug: course.slug,
        imageUrl: course.imageUrl,
        price: course.price,
        compareAtPrice: course.compareAtPrice,
        category: course.category,
        instructorName: course.instructorName ?? course.creatorName ?? null,
        institutionName: course.institutionName ?? categoryLabel,
      }}
    />
  );
}

export { normalizeCoursePrice };
