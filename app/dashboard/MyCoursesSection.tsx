"use client";

import { useState, useMemo } from "react";
import { BeCourseCard } from "@/components/be-home/BeCourseCard";
import { CoursesCarousel, CoursesCarouselItem } from "@/components/CoursesCarousel";
import { useT } from "@/components/LocaleProvider";
import { getDir } from "@/lib/i18n/core";
import type { Course } from "@/lib/types";

export type CollegeOption = {
  id: string;
  name: string;
  nameAr?: string | null;
  slug?: string;
};

type CourseWithCategory = Course & {
  category?: { id?: string; name?: string; nameAr?: string | null; slug?: string } | null;
  creatorName?: string | null;
  lessonsCount?: number;
  chaptersCount?: number;
};

type BeCardCourse = Parameters<typeof BeCourseCard>[0]["course"];

function toBeCardCourse(c: CourseWithCategory): BeCardCourse {
  const raw = c as unknown as Record<string, unknown>;
  const cat = c.category;
  const titleAr = raw.titleAr != null ? String(raw.titleAr) : (c.title_ar ?? null);
  const imageUrl = raw.imageUrl != null ? String(raw.imageUrl) : (c.image_url ?? null);
  const categoryLabel = cat?.nameAr?.trim() || cat?.name?.trim() || null;
  return {
    id: c.id,
    title: c.title,
    titleAr: titleAr ?? undefined,
    slug: c.slug,
    imageUrl: imageUrl ?? undefined,
    price: c.price,
    category: cat ?? undefined,
    instructorName: c.creatorName?.trim() || undefined,
    institutionName: categoryLabel ?? undefined,
    chaptersCount: c.chaptersCount ?? 0,
    lessonsCount: c.lessonsCount ?? 0,
  };
}

function groupCoursesByCollege(
  courses: CourseWithCategory[],
  colleges: CollegeOption[],
  uncategorizedTitle: string,
): { id: string; title: string; courses: CourseWithCategory[] }[] {
  const byId = new Map<string, CourseWithCategory[]>();
  const uncategorized: CourseWithCategory[] = [];

  for (const course of courses) {
    const catId = course.category?.id;
    if (catId) {
      if (!byId.has(catId)) byId.set(catId, []);
      byId.get(catId)!.push(course);
    } else {
      uncategorized.push(course);
    }
  }

  const sections: { id: string; title: string; courses: CourseWithCategory[] }[] = colleges.map((col) => ({
    id: col.id,
    title: col.nameAr?.trim() || col.name,
    courses: byId.get(col.id) ?? [],
  }));

  const collegeIds = new Set(colleges.map((c) => c.id));
  for (const [id, list] of byId) {
    if (!collegeIds.has(id) && list.length > 0) {
      const label = list[0].category?.nameAr?.trim() || list[0].category?.name?.trim() || uncategorizedTitle;
      sections.push({ id, title: label, courses: list });
    }
  }

  if (uncategorized.length > 0) {
    sections.push({ id: "__uncategorized__", title: uncategorizedTitle, courses: uncategorized });
  }

  return sections;
}

export function MyCoursesSection({
  courses,
  colleges,
}: {
  courses: CourseWithCategory[];
  colleges: CollegeOption[];
}) {
  const t = useT();
  const dir = getDir();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => {
      const r = c as unknown as Record<string, unknown>;
      const title = String(r.titleAr ?? c.title_ar ?? c.title ?? "").toLowerCase();
      const titleEn = String(c.title ?? "").toLowerCase();
      const slug = String(c.slug ?? "").toLowerCase();
      return title.includes(q) || titleEn.includes(q) || slug.includes(q);
    });
  }, [courses, search]);

  const sections = useMemo(
    () =>
      groupCoursesByCollege(
        filtered,
        colleges,
        t("dashboard.page.myCourses.uncategorizedSection", "Other courses"),
      ),
    [filtered, colleges, t],
  );

  if (courses.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          {t("dashboard.page.availableCoursesTitle", "Available courses")}
        </h2>
        <p className="text-[var(--color-muted)]">
          {t("dashboard.page.myCourses.noPublishedCourses", "No published courses yet.")}
        </p>
      </div>
    );
  }

  const cardClassName =
    "rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]";

  return (
    <div className="space-y-6">
      <div className={cardClassName}>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          {t("dashboard.page.availableCoursesTitle", "Available courses")}
        </h2>

        <div>
          <label htmlFor="my-courses-search" className="sr-only">
            {t("dashboard.page.myCourses.searchLabel", "Search my courses")}
          </label>
          <input
            id="my-courses-search"
            dir={dir}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(
              "dashboard.page.myCourses.searchPlaceholder",
              "Search by course name or URL slug...",
            )}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="mt-4 text-[var(--color-muted)]">
            {t("dashboard.page.myCourses.noSearchResults", "No results match your search.")}
          </p>
        ) : null}
      </div>

      {filtered.length > 0
        ? (search.trim() ? sections.filter((s) => s.courses.length > 0) : sections).map((section) => (
            <section key={section.id} className={cardClassName}>
              <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">{section.title}</h2>
              {section.courses.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">
                  {t("dashboard.page.myCourses.emptyCollege", "No courses in this university yet.")}
                </p>
              ) : (
                <CoursesCarousel>
                  {section.courses.map((course) => (
                    <CoursesCarouselItem key={course.id}>
                      <BeCourseCard course={toBeCardCourse(course)} />
                    </CoursesCarouselItem>
                  ))}
                </CoursesCarousel>
              )}
            </section>
          ))
        : null}
    </div>
  );
}
