import Link from "next/link";
import dynamic from "next/dynamic";
import { BeHomeHeroVisual } from "./BeHomeHeroVisual";
import { BeHomeHeroBackground } from "./BeHomeHeroBackground";
import { BeHomeHeroStatsGrid } from "./BeHomeHeroStatsGrid";
import { BeSectionTitle } from "./BeSectionTitle";
import { HomeReviewsSection } from "@/components/HomeReviewsSection";
import { BeHomeSearchBar } from "./BeHomeSearchBar";
import { BeCourseCard } from "./BeCourseCard";
import { SubscriptionPlanCard } from "@/components/SubscriptionPlanCard";
import { getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import type { HomepageSetting } from "@/lib/types";
import type { Session } from "next-auth";
import {
  getCategories,
  getCoursesPublished,
  getReviews,
  getTeacherIdsExcludedFromPublicCourseLists,
  listActiveSubscriptionPlansPublic,
  listTeachersForHomepage,
  selectTeachersForHomepagePreview,
  userHasActivePlatformSubscription,
  getLatestPlatformSubscriptionExpiry,
} from "@/lib/db";
import { parsePlatformDetailsItems } from "@/lib/platform-details";
import { homepageDefaultForLocale } from "@/lib/homepage-default-for-locale";
import { cairo, tajawal } from "@/lib/fonts";
import {
  HOMEPAGE_DEFAULT_PLATFORM_DETAILS_SUBTITLE_AR,
  HOMEPAGE_DEFAULT_PLATFORM_DETAILS_TITLE_AR,
  HOMEPAGE_DEFAULT_REVIEWS_SECTION_SUBTITLE_AR,
  HOMEPAGE_DEFAULT_REVIEWS_SECTION_TITLE_AR,
} from "@/lib/homepage-known-defaults";

const BeHomeCoursesCarousel = dynamic(
  () => import("./BeHomeCoursesCarousel").then((m) => ({ default: m.BeHomeCoursesCarousel })),
  { loading: () => <div className="mx-auto mt-10 h-64 max-w-6xl animate-pulse rounded-2xl bg-slate-100" /> },
);

type CourseRow = Awaited<ReturnType<typeof getCoursesPublished>>[number];

function courseToCard(c: CourseRow, platformName: string) {
  const row = c as CourseRow & {
    titleAr?: string | null;
    imageUrl?: string | null;
    image_url?: string | null;
    creatorName?: string | null;
    lessonsCount?: number;
    chaptersCount?: number;
  };
  const category = (c as { category?: { name?: string; nameAr?: string | null } }).category ?? null;
  const categoryLabel = category?.nameAr?.trim() || category?.name?.trim() || null;
  return {
    id: c.id,
    title: c.title,
    titleAr: row.titleAr ?? null,
    slug: c.slug,
    imageUrl: row.imageUrl ?? row.image_url ?? null,
    price: c.price as CourseRow["price"],
    category,
    instructorName: row.creatorName ?? null,
    institutionName: categoryLabel ?? platformName,
    chaptersCount: row.chaptersCount ?? 0,
    lessonsCount: row.lessonsCount ?? 0,
  };
}

export async function BeHomePage({
  homepageSettings,
  session,
}: {
  homepageSettings: HomepageSetting;
  session: Session | null;
}) {
  const t = await getServerTranslator();
  const isLoggedIn = !!session;
  const isStudent = session?.user?.role === "STUDENT";
  let studentHasActiveSub = false;
  let studentSubExpiresIso: string | null = null;
  if (isStudent && session?.user?.id) {
    try {
      studentHasActiveSub = await userHasActivePlatformSubscription(session.user.id);
      if (studentHasActiveSub) {
        const exp = await getLatestPlatformSubscriptionExpiry(session.user.id);
        studentSubExpiresIso = exp ? exp.toISOString() : null;
      }
    } catch {
      /* ignore */
    }
  }

  let courses: CourseRow[] = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let reviews: Awaited<ReturnType<typeof getReviews>> = [];
  let teachers: Awaited<ReturnType<typeof listTeachersForHomepage>> = [];
  let subscriptionPlans: Awaited<ReturnType<typeof listActiveSubscriptionPlansPublic>> = [];

  try {
    const [
      coursesResult,
      categoriesResult,
      hideCreatorsResult,
      teachersResult,
      plansResult,
      reviewsResult,
    ] = await Promise.allSettled([
      getCoursesPublished(true),
      getCategories(),
      getTeacherIdsExcludedFromPublicCourseLists(),
      homepageSettings.teachersEnabled ? listTeachersForHomepage() : Promise.resolve([]),
      homepageSettings.subscriptionsEnabled ? listActiveSubscriptionPlansPublic() : Promise.resolve([]),
      getReviews(),
    ]);

    if (coursesResult.status === "fulfilled") courses = coursesResult.value;
    if (categoriesResult.status === "fulfilled") categories = categoriesResult.value;
    if (teachersResult.status === "fulfilled") teachers = teachersResult.value;
    if (plansResult.status === "fulfilled") subscriptionPlans = plansResult.value;
    if (reviewsResult.status === "fulfilled") reviews = reviewsResult.value;

    if (hideCreatorsResult.status === "fulfilled") {
      const hideTeacherCreators = hideCreatorsResult.value;
      if (hideTeacherCreators.size > 0) {
        courses = courses.filter((c) => {
          const creator =
            (c as { createdById?: string | null }).createdById ??
            (c as { created_by_id?: string | null }).created_by_id ??
            null;
          return !creator || !hideTeacherCreators.has(creator);
        });
      }
    }
  } catch {
    /* DB unavailable */
  }

  const heroTitle =
    pickLocalizedText(homepageSettings.heroTitle, homepageSettings.heroTitleEn) ||
    t("home.defaultHeroTitle", "Mr. Essam Mohy");
  const heroSlogan =
    pickLocalizedText(homepageSettings.heroSlogan, homepageSettings.heroSloganEn) ||
    t("home.defaultHero3Subtitle", "Join over one million students with our plan");
  const teacherImage = homepageSettings.teacherImageUrl?.trim() || "/instructor.png";

  const categoryOptions = categories.map((cat) => ({
    slug: cat.slug,
    label: pickLocalizedText((cat as { nameAr?: string | null }).nameAr, cat.name),
  }));

  const platformName =
    pickLocalizedText(homepageSettings.platformName, homepageSettings.platformNameEn) ||
    t("footer.defaultTitle", "Stemix Academy");

  const latestCourses = courses.slice(0, 12).map((c) => courseToCard(c, platformName));
  const browseCourses = courses.slice(0, 8).map((c) => courseToCard(c, platformName));

  const teachersPreview =
    teachers.length > 0
      ? selectTeachersForHomepagePreview(teachers, 8).map(({ homepageOrder, ...row }) => {
          void homepageOrder;
          return row;
        })
      : [];

  const platformDetailsItems = parsePlatformDetailsItems(homepageSettings.platformDetailsItems).map((item) => ({
    ...item,
    title: pickLocalizedText(item.title, item.titleEn),
    description: pickLocalizedText(item.description, item.descriptionEn),
  }));

  const reviewsTitle = homepageDefaultForLocale(
    pickLocalizedText(homepageSettings.reviewsSectionTitle, homepageSettings.reviewsSectionTitleEn),
    HOMEPAGE_DEFAULT_REVIEWS_SECTION_TITLE_AR,
    "home.reviewsTitleDefault",
    t,
    "From our students' opinions",
  );
  const reviewsSubtitle = homepageDefaultForLocale(
    pickLocalizedText(homepageSettings.reviewsSectionSubtitle, homepageSettings.reviewsSectionSubtitleEn),
    HOMEPAGE_DEFAULT_REVIEWS_SECTION_SUBTITLE_AR,
    "home.reviewsSubtitleDefault",
    t,
    "Real experiences from platform students",
  );

  const helpTitle = homepageDefaultForLocale(pickLocalizedText(homepageSettings.platformDetailsTitle, homepageSettings.platformDetailsTitleEn),
    HOMEPAGE_DEFAULT_PLATFORM_DETAILS_TITLE_AR,
    "home.platformDetailsDefaultTitle",
    t,
    "Help Center",
  );
  const helpSubtitle = homepageDefaultForLocale(pickLocalizedText(homepageSettings.platformDetailsSubtitle, homepageSettings.platformDetailsSubtitleEn),
    HOMEPAGE_DEFAULT_PLATFORM_DETAILS_SUBTITLE_AR,
    "home.platformDetailsDefaultSubtitle",
    t,
    "Learn more about the platform and how to use it",
  );

  const heroStats = [
    { value: `+${courses.length}`, label: t("beHome.statCourses", "Published courses") },
    { value: `+${teachers.length || 1}`, label: t("beHome.statTeachers", "Expert teachers") },
    { value: `+${reviews.length}`, label: t("beHome.statReviews", "Student reviews") },
    { value: "24/7", label: t("beHome.statSupport", "Support") },
  ];

  return (
    <>
      <section className="be-hero-section relative overflow-hidden pb-10 pt-8 sm:pb-14 sm:pt-12">
        <BeHomeHeroBackground />
        <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-20">
            <div className={`order-2 text-center lg:order-1 lg:text-start ${tajawal.className}`}>
              <span className={`be-hero-badge ${tajawal.className}`}>
                {t("beHome.heroBadge", "Customized teaching for every student")}
              </span>
              <h1 className={`be-hero-title ${cairo.className}`}>{heroTitle}</h1>
              <p className={`be-hero-slogan ${tajawal.className}`}>{heroSlogan}</p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Link href="/courses" className="be-btn-primary px-6 py-2.5 text-sm sm:text-base">
                  {t("beHome.browseCoursesCta", "Browse courses")}
                </Link>
                <Link href="/courses?free=1" className="be-btn-outline px-6 py-2.5 text-sm sm:text-base">
                  {t("beHome.freeSessions", "Free sessions")}
                </Link>
              </div>
              <div className="mt-8">
                <BeHomeHeroStatsGrid stats={heroStats} />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <BeHomeHeroVisual imageUrl={teacherImage} imageAlt={heroTitle} />
            </div>
          </div>

          <div className="be-hero-search-wrap">
            <BeHomeSearchBar categories={categoryOptions} />
          </div>
        </div>
      </section>

      {latestCourses.length > 0 ? (
        <section id="home-next-section" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6">
          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-[var(--be-navy)]">{t("beHome.latestCourses", "Latest courses")}</h2>
            <Link href="/courses" className="rounded-lg border border-[var(--be-border)] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--be-navy)] hover:text-[var(--be-navy)]">
              {t("beHome.viewAll", "View all")}
            </Link>
          </div>
          <BeHomeCoursesCarousel courses={latestCourses} />
        </section>
      ) : null}

      {categories.length > 0 ? (
        <section id="categories" className="border-y border-[var(--be-border)] bg-slate-50 py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <BeSectionTitle>{t("beHome.categoriesTitle", "Categories")}</BeSectionTitle>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/courses?category=${encodeURIComponent(cat.slug)}`}
                  className="flex min-h-[5rem] items-center justify-center rounded-xl border border-[var(--be-border)] bg-white px-3 py-4 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[var(--be-navy)] hover:text-[var(--be-navy)]"
                >
                  {pickLocalizedText((cat as { nameAr?: string | null }).nameAr, cat.name)}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {homepageSettings.subscriptionsEnabled && subscriptionPlans.length > 0 ? (
        <section id="bundles" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <BeSectionTitle>{t("beHome.bundlesTitle", "Bundles (savings packages)")}</BeSectionTitle>
          <div className="mt-10 flex flex-wrap justify-center gap-8">
            {subscriptionPlans.map((plan) => (
              <SubscriptionPlanCard
                key={plan.id}
                plan={plan}
                isStudent={isStudent}
                isLoggedIn={isLoggedIn}
                hasActivePlatformSubscription={studentHasActiveSub}
                activePlatformSubscriptionExpiresAtIso={studentSubExpiresIso}
                loginCallbackUrl="/#bundles"
              />
            ))}
          </div>
        </section>
      ) : null}

      <HomeReviewsSection reviews={reviews} title={reviewsTitle} subtitle={reviewsSubtitle} />

      {homepageSettings.teachersEnabled && teachersPreview.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <BeSectionTitle>{t("beHome.teachersTitle", "Meet the teachers")}</BeSectionTitle>
          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {teachersPreview.map((teacher) => (
              <Link
                key={teacher.id}
                href={`/courses?teacher=${encodeURIComponent(teacher.id)}`}
                className="group overflow-hidden rounded-2xl border border-[var(--be-border)] bg-slate-100 text-center shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-200">
                  {teacher.teacherAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={teacher.teacherAvatarUrl}
                      alt=""
                      className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100">
                      <span className="text-5xl opacity-40">👨‍🏫</span>
                    </div>
                  )}
                </div>
                <div className="bg-white px-3 py-4">
                  <p className="font-bold text-slate-800">{teacher.name}</p>
                  {teacher.teacherSubject ? (
                    <p className="mt-0.5 text-xs text-[var(--be-muted)]">{teacher.teacherSubject}</p>
                  ) : (
                    <p className="mt-0.5 text-xs text-[var(--be-muted)]">{t("beHome.instructor", "Instructor")}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {homepageSettings.platformDetailsEnabled && platformDetailsItems.length > 0 ? (
        <section className="border-t border-[var(--be-border)] bg-white py-14">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
            <BeSectionTitle>{helpTitle}</BeSectionTitle>
            <p className="mt-3 text-sm text-[var(--be-muted)]">{helpSubtitle}</p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {platformDetailsItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-[var(--be-border)] bg-sky-50"
                >
                  {item.customIconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.customIconUrl} alt="" className="aspect-video w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-sky-100 text-4xl">▶</div>
                  )}
                  <div className="p-4 text-start">
                    <p className="font-bold text-[var(--be-navy)]">{item.title}</p>
                    {item.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--be-muted)]">{item.description}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {browseCourses.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <BeSectionTitle>{t("beHome.browseAll", "Browse all courses")}</BeSectionTitle>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {browseCourses.map((course) => (
              <BeCourseCard key={course.id} course={course} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/courses" className="be-btn-primary inline-block px-8 py-2.5 text-sm">
              {t("beHome.viewAllCourses", "View all courses")}
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}
