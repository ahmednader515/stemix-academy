import Link from "next/link";
import type { Session } from "next-auth";
import {
  getCategories,
  getCoursesPublished,
  getReviews,
  listActiveSubscriptionPlansPublic,
  listStoreProductsPublic,
  listTeachersForHomepage,
  selectTeachersForHomepagePreview,
  userHasActivePlatformSubscription,
  getLatestPlatformSubscriptionExpiry,
} from "@/lib/db";
import type { HomepageSetting } from "@/lib/types";
import { CourseCard } from "@/components/CourseCard";
import { HomeTeachersSection } from "@/components/HomeTeachersSection";
import { HomeSubscriptionsSection } from "@/components/HomeSubscriptionsSection";
import { HomeStoreSection } from "@/components/HomeStoreSection";
import { HomePlatformDetailsSection } from "@/components/HomePlatformDetailsSection";
import { parsePlatformDetailsItems } from "@/lib/platform-details";
import { parsePlatformNewsItems } from "@/lib/platform-news";
import { HomePlatformNewsSlider } from "@/components/HomePlatformNewsSlider";
import { getServerTranslator } from "@/lib/i18n/server";
import {
  HOMEPAGE_DEFAULT_CTA_BADGE_AR,
  HOMEPAGE_DEFAULT_CTA_BUTTON_AR,
  HOMEPAGE_DEFAULT_CTA_DESCRIPTION_AR,
  HOMEPAGE_DEFAULT_CTA_TITLE_AR,
  HOMEPAGE_DEFAULT_PLATFORM_DETAILS_SUBTITLE_AR,
  HOMEPAGE_DEFAULT_PLATFORM_DETAILS_TITLE_AR,
  HOMEPAGE_DEFAULT_PLATFORM_NEWS_TITLE_AR,
  HOMEPAGE_DEFAULT_REVIEWS_SECTION_SUBTITLE_AR,
  HOMEPAGE_DEFAULT_REVIEWS_SECTION_TITLE_AR,
  HOMEPAGE_DEFAULT_SOCIAL_LEFT_LABEL_AR,
  HOMEPAGE_DEFAULT_SOCIAL_RIGHT_LABEL_AR,
  HOMEPAGE_DEFAULT_STORE_SECTION_DESCRIPTION_AR,
  HOMEPAGE_DEFAULT_STORE_SECTION_TITLE_AR,
} from "@/lib/homepage-known-defaults";
import { homepageDefaultForLocale } from "@/lib/homepage-default-for-locale";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

type CourseWithCategory = Awaited<ReturnType<typeof getCoursesPublished>>[number];

export async function HomePageBelowFold({
  homepageSettings,
  session,
}: {
  homepageSettings: HomepageSetting;
  session: Session | null;
}) {
  const t = await getServerTranslator();
  let courses: CourseWithCategory[] = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let reviews: Awaited<ReturnType<typeof getReviews>> = [];
  let teachersForHome: Awaited<ReturnType<typeof listTeachersForHomepage>> = [];
  let subscriptionPlansHome: Awaited<ReturnType<typeof listActiveSubscriptionPlansPublic>> = [];
  let storeProductsHome: Awaited<ReturnType<typeof listStoreProductsPublic>> = [];

  if (homepageSettings.teachersEnabled) {
    try {
      teachersForHome = await listTeachersForHomepage();
    } catch {
      /* جدول أو أعمدة غير جاهزة */
    }
  }
  if (homepageSettings.subscriptionsEnabled) {
    try {
      subscriptionPlansHome = await listActiveSubscriptionPlansPublic();
    } catch {
      /* جداول الاشتراك غير جاهزة */
    }
  }
  if (homepageSettings.storeEnabled) {
    try {
      storeProductsHome = await listStoreProductsPublic();
    } catch {
      /* جداول المتجر غير جاهزة */
    }
  }

  let studentPlatformSubscription: { active: boolean; expiresAtIso: string | null } | null = null;
  if (
    homepageSettings.subscriptionsEnabled &&
    session?.user?.role === "STUDENT" &&
    session.user.id
  ) {
    try {
      const active = await userHasActivePlatformSubscription(session.user.id);
      const exp = active ? await getLatestPlatformSubscriptionExpiry(session.user.id) : null;
      studentPlatformSubscription = {
        active,
        expiresAtIso: exp ? exp.toISOString() : null,
      };
    } catch {
      studentPlatformSubscription = { active: false, expiresAtIso: null };
    }
  }

  try {
    [courses, categories] = await Promise.all([getCoursesPublished(true), getCategories()]);
  } catch {
    // لا قاعدة بيانات أو غير متصلة
  }

  if (homepageSettings.teachersEnabled && teachersForHome.length > 0) {
    const teacherAccountIds = new Set(teachersForHome.map((t) => t.id));
    courses = courses.filter((c) => {
      const creator =
        (c as { createdById?: string | null }).createdById ??
        (c as { created_by_id?: string | null }).created_by_id ??
        null;
      return !creator || !teacherAccountIds.has(creator);
    });
  }

  try {
    reviews = await getReviews();
  } catch {
    /* جدول التعليقات غير موجود */
  }

  const platformNewsSlides = parsePlatformNewsItems(homepageSettings.platformNewsItems);
  const localizedPlatformNewsSlides = platformNewsSlides.map((item) => ({
    ...item,
    description: pickLocalizedText(item.description, item.descriptionEn),
  }));
  const showPlatformNewsSection =
    Boolean(homepageSettings.platformNewsEnabled) && localizedPlatformNewsSlides.length > 0;

  const teachersHomePreview =
    teachersForHome.length > 0
      ? selectTeachersForHomepagePreview(teachersForHome, 4).map(({ homepageOrder, ...row }) => {
          void homepageOrder;
          return row;
        })
      : [];

  const categoryIdToCourses = new Map<string, CourseWithCategory[]>();
  const uncategorized: CourseWithCategory[] = [];
  for (const c of courses) {
    const catId = (c as { category?: { id?: string } }).category?.id;
    if (catId) {
      if (!categoryIdToCourses.has(catId)) categoryIdToCourses.set(catId, []);
      categoryIdToCourses.get(catId)!.push(c);
    } else {
      uncategorized.push(c);
    }
  }

  const sections: { title: string; slug?: string; courses: CourseWithCategory[] }[] = [];
  for (const cat of categories) {
    const list = categoryIdToCourses.get(cat.id);
    if (list?.length) {
      sections.push({
        title: pickLocalizedText((cat as { nameAr?: string | null }).nameAr, cat.name),
        slug: cat.slug,
        courses: list,
      });
    }
  }
  if (uncategorized.length > 0) {
    sections.push({ title: t("courses.allCoursesTitle", "All courses"), courses: uncategorized });
  }

  const platformDetailsItems = parsePlatformDetailsItems(homepageSettings.platformDetailsItems);
  const localizedPlatformDetailsItems = platformDetailsItems.map((item) => ({
    ...item,
    title: pickLocalizedText(item.title, item.titleEn),
    description: pickLocalizedText(item.description, item.descriptionEn),
  }));

  const rawReviewsTitle = pickLocalizedText(homepageSettings.reviewsSectionTitle,
    homepageSettings.reviewsSectionTitleEn,
  );
  const rawReviewsSubtitle = pickLocalizedText(homepageSettings.reviewsSectionSubtitle,
    homepageSettings.reviewsSectionSubtitleEn,
  );
  const reviewsTitle = rawReviewsTitle || t("home.reviewsTitleDefault", "ماذا يقول الطلاب");
  const reviewsSubtitle =
    rawReviewsSubtitle || t("home.reviewsSubtitleDefault", "تجارب حقيقية من طلاب المنصة");

  const rawCtaBadge = pickLocalizedText(homepageSettings.ctaBadgeText,
    homepageSettings.ctaBadgeTextEn,
  );
  const rawCtaTitle = pickLocalizedText(homepageSettings.ctaTitle, homepageSettings.ctaTitleEn);
  const rawCtaDescription = pickLocalizedText(homepageSettings.ctaDescription,
    homepageSettings.ctaDescriptionEn,
  );
  const rawCtaButton = pickLocalizedText(homepageSettings.ctaButtonText,
    homepageSettings.ctaButtonTextEn,
  );
  const platformDetailsTitle = homepageDefaultForLocale(pickLocalizedText(homepageSettings.platformDetailsTitle, homepageSettings.platformDetailsTitleEn),
    HOMEPAGE_DEFAULT_PLATFORM_DETAILS_TITLE_AR,
    "home.platformDetailsDefaultTitle",
    t,
    "Qalam, the ideal solution!",
  );
  const platformDetailsSubtitle = homepageDefaultForLocale(pickLocalizedText(homepageSettings.platformDetailsSubtitle, homepageSettings.platformDetailsSubtitleEn),
    HOMEPAGE_DEFAULT_PLATFORM_DETAILS_SUBTITLE_AR,
    "home.platformDetailsDefaultSubtitle",
    t,
    "Discover what makes the platform stand out",
  );
  const storeSectionTitle = homepageDefaultForLocale(pickLocalizedText(homepageSettings.storeSectionTitle, homepageSettings.storeSectionTitleEn),
    HOMEPAGE_DEFAULT_STORE_SECTION_TITLE_AR,
    "home.storeSectionDefaultTitle",
    t,
    "Platform Store",
  );
  const storeSectionDescription = homepageDefaultForLocale(pickLocalizedText(homepageSettings.storeSectionDescription,
      homepageSettings.storeSectionDescriptionEn,
    ),
    HOMEPAGE_DEFAULT_STORE_SECTION_DESCRIPTION_AR,
    "home.storeSectionDefaultDescription",
    t,
    "Welcome to the platform store with essential study materials and books. Choose what suits your needs and benefit from organized digital content that supports your learning journey.",
  );
  const platformNewsTitle = homepageDefaultForLocale(pickLocalizedText(homepageSettings.platformNewsSectionTitle,
      homepageSettings.platformNewsSectionTitleEn,
    ),
    HOMEPAGE_DEFAULT_PLATFORM_NEWS_TITLE_AR,
    "home.platformNewsDefaultTitle",
    t,
    "Platform News",
  );
  const ctaBadge = homepageDefaultForLocale(rawCtaBadge,
    HOMEPAGE_DEFAULT_CTA_BADGE_AR,
    "home.ctaBadgeDefault",
    t,
    "A stronger start to learning",
  );
  const ctaTitle = homepageDefaultForLocale(rawCtaTitle,
    HOMEPAGE_DEFAULT_CTA_TITLE_AR,
    "home.ctaTitleDefault",
    t,
    "Ready to turn your dream into a real result?",
  );
  const ctaDescription = homepageDefaultForLocale(rawCtaDescription,
    HOMEPAGE_DEFAULT_CTA_DESCRIPTION_AR,
    "home.ctaDescriptionDefault",
    t,
    "Start now with a confident step: organized content, clear explanations, and practical exercises that help you retain what you learn faster. Every lesson you complete today brings you closer to the level you deserve tomorrow.",
  );
  const ctaButton = homepageDefaultForLocale(rawCtaButton,
    HOMEPAGE_DEFAULT_CTA_BUTTON_AR,
    "home.ctaButtonDefault",
    t,
    "Start your journey now",
  );

  return (
    <>
      {homepageSettings.platformDetailsEnabled && platformDetailsItems.length > 0 ? (
        <HomePlatformDetailsSection
          title={platformDetailsTitle}
          subtitle={platformDetailsSubtitle || null}
          backgroundColor={homepageSettings.platformDetailsBackgroundColor?.trim() || null}
          items={localizedPlatformDetailsItems}
        />
      ) : null}

      {homepageSettings.teachersEnabled ? (
        <HomeTeachersSection enabled initialTeachers={teachersHomePreview} />
      ) : null}

      {homepageSettings.teachersEnabled && homepageSettings.subscriptionsEnabled ? (
        <div className="h-12 sm:h-16 md:h-24" aria-hidden />
      ) : null}

      {homepageSettings.subscriptionsEnabled ? (
        <HomeSubscriptionsSection
          enabled
          plans={subscriptionPlansHome}
          isStudent={session?.user?.role === "STUDENT"}
          isLoggedIn={!!session}
          studentPlatformSubscription={studentPlatformSubscription}
        />
      ) : null}

      {sections.length > 0
        ? sections.map((section, idx) => (
            <section
              key={section.slug ?? `uncategorized-${idx}`}
              className="bg-white mx-auto max-w-6xl px-4 py-16 sm:px-6"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--color-foreground)]">{section.title}</h2>
                  <p className="mt-1 text-[var(--color-muted)]">
                    {section.slug
                      ? `${t("courses.categoryCoursesPrefix", "Category courses:")} ${section.title}`
                      : t("courses.allCoursesTitle", "All courses")}
                  </p>
                </div>
                <Link
                  href={section.slug ? `/courses?category=${encodeURIComponent(section.slug)}` : "/courses"}
                  className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                  {t("common.courses", "Courses")} ←
                </Link>
              </div>

              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {section.courses.slice(0, 6).map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
              {section.courses.length > 6 && (
                <div className="mt-6 text-center">
                  <Link
                    href={section.slug ? `/courses?category=${encodeURIComponent(section.slug)}` : "/courses"}
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                  >
                    {t("common.courses", "Courses")} ({section.courses.length})
                  </Link>
                </div>
              )}
            </section>
          ))
        : null}

      {homepageSettings.storeEnabled && storeProductsHome.length > 0 ? (
        <HomeStoreSection
          productsCount={storeProductsHome.length}
          sectionTitle={storeSectionTitle}
          sectionDescription={storeSectionDescription}
        />
      ) : null}

      <section className="reviews-section border-t border-[var(--color-border)] bg-[var(--color-reviews-bg)] px-2 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="px-2 text-2xl font-bold text-[var(--color-foreground)] sm:px-0">{reviewsTitle}</h2>
          <p className="mt-1 px-2 text-[var(--color-muted)] sm:px-0">{reviewsSubtitle}</p>
          {reviews.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              {reviews.map((r) => {
                const authorName = r.authorName?.trim() ?? "";
                const letter =
                  (r.avatarLetter && r.avatarLetter.trim()) || (authorName[0] ?? "");
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
                      <p className={showAuthorBlock ? "mt-4 text-[var(--color-foreground)]" : "text-[var(--color-foreground)]"}>
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
            <p className="mt-10 text-center text-[var(--color-muted)]">{t("home.noReviewsYet", "No reviews yet.")}</p>
          )}
        </div>
      </section>

      {showPlatformNewsSection ? (
        <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-6 text-2xl font-bold text-[var(--color-foreground)]">
              {platformNewsTitle}
            </h2>
            <HomePlatformNewsSlider items={localizedPlatformNewsSlides} />
          </div>
        </section>
      ) : null}

      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-8 sm:p-12">
            <div className="text-center">
              <p className="inline-flex items-center rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-1 text-xs font-semibold text-[var(--color-primary)] sm:text-sm">
                {ctaBadge}
              </p>
              <h2 className="mt-4 text-3xl font-extrabold text-[var(--color-foreground)] sm:text-4xl">
                {ctaTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
                {ctaDescription}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-3 py-1 text-xs text-[var(--color-muted)]">
                  {t("home.ctaChip1", "Clear, simple explanations")}
                </span>
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-3 py-1 text-xs text-[var(--color-muted)]">
                  {t("home.ctaChip2", "Ongoing support")}
                </span>
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-3 py-1 text-xs text-[var(--color-muted)]">
                  {t("home.ctaChip3", "Tangible results")}
                </span>
              </div>

              <Link
                href="/#home-next-section"
                className="mt-8 inline-flex items-center justify-center rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-8 py-3 text-base font-bold text-white transition hover:scale-[1.02] hover:bg-[var(--color-primary-hover)]"
              >
                {ctaButton}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {(() => {
        const ytIcon = (
          <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8M9.6 15.8V8.2L16.2 12z" />
          </svg>
        );
        const liIcon = (
          <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12M7.12 20.45H3.56V9h3.56z" />
          </svg>
        );
        const fbIcon = (
          <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        );
        const waIcon = (
          <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        );
        const tgIcon = (
          <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M9.78 15.87 9.4 21c.54 0 .78-.23 1.06-.5l2.55-2.44 5.28 3.87c.97.53 1.65.25 1.91-.9L23.65 4.8c.34-1.4-.5-1.95-1.44-1.6L1.85 11.09c-1.39.54-1.37 1.32-.24 1.67l5.2 1.62L18.9 6.7c.57-.35 1.1-.16.67.22" />
          </svg>
        );

        const baseBtn =
          "group fixed z-50 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 p-2 text-white shadow-[0_12px_30px_rgba(0,0,0,0.25)] backdrop-blur-md transition hover:bg-black/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60";
        const circle =
          "flex h-11 w-11 items-center justify-center rounded-full shadow-sm transition group-hover:scale-[1.03]";
        const label =
          "pointer-events-none hidden select-none rounded-full bg-black/50 px-3 py-1 text-xs font-semibold tracking-wide text-white/95 shadow-sm md:inline-flex md:translate-x-0 md:opacity-100 group-hover:inline-flex group-hover:opacity-100 group-focus-visible:inline-flex";

        const verticalPositions = ["bottom-6", "bottom-24", "bottom-42", "bottom-60", "bottom-78"] as const;
        const rightLabelWord = homepageDefaultForLocale(pickLocalizedText(homepageSettings.socialRightLabel, homepageSettings.socialRightLabelEn),
          HOMEPAGE_DEFAULT_SOCIAL_RIGHT_LABEL_AR,
          "home.socialRightDefaultLabel",
          t,
          "Support",
        );
        const leftLabelWord = homepageDefaultForLocale(pickLocalizedText(homepageSettings.socialLeftLabel, homepageSettings.socialLeftLabelEn),
          HOMEPAGE_DEFAULT_SOCIAL_LEFT_LABEL_AR,
          "home.socialLeftDefaultLabel",
          t,
          "Team support",
        );
        const leftEnabled = homepageSettings.socialLeftEnabled !== false;

        const rightLinks = [
          {
            href: homepageSettings.youtubeUrl?.trim() || null,
            label: `${rightLabelWord} (YouTube)`,
            title: `YouTube — ${rightLabelWord}`,
            ariaLabel: `يوتيوب ${rightLabelWord} (يمين)`,
            icon: ytIcon,
            bg: "bg-[#FF0000]",
          },
          {
            href: homepageSettings.linkedinUrl?.trim() || null,
            label: `${rightLabelWord} (LinkedIn)`,
            title: `LinkedIn — ${rightLabelWord}`,
            ariaLabel: `لينكدإن ${rightLabelWord} (يمين)`,
            icon: liIcon,
            bg: "bg-[#0A66C2]",
          },
          {
            href: homepageSettings.facebookUrl?.trim() || null,
            label: `${rightLabelWord} (Facebook)`,
            title: `فيسبوك — ${rightLabelWord}`,
            ariaLabel: `فيسبوك ${rightLabelWord} (يمين)`,
            icon: fbIcon,
            bg: "bg-[#1877F2]",
          },
          {
            href: homepageSettings.whatsappUrl?.trim() || null,
            label: `${rightLabelWord} (WhatsApp)`,
            title: `واتساب — ${rightLabelWord}`,
            ariaLabel: `واتساب ${rightLabelWord} (يمين)`,
            icon: waIcon,
            bg: "bg-[#25D366]",
          },
          {
            href: homepageSettings.telegramUrl?.trim() || null,
            label: `${rightLabelWord} (Telegram)`,
            title: `Telegram — ${rightLabelWord}`,
            ariaLabel: `تليجرام ${rightLabelWord} (يمين)`,
            icon: tgIcon,
            bg: "bg-[#229ED9]",
          },
        ].filter((item) => item.href);

        const leftLinks = leftEnabled
          ? [
          {
            href: homepageSettings.teamYoutubeUrl?.trim() || null,
            label: `${leftLabelWord} (YouTube)`,
            title: `YouTube — ${leftLabelWord}`,
            ariaLabel: `يوتيوب ${leftLabelWord} (يسار)`,
            icon: ytIcon,
            bg: "bg-[#FF0000]",
          },
          {
            href: homepageSettings.teamLinkedinUrl?.trim() || null,
            label: `${leftLabelWord} (LinkedIn)`,
            title: `LinkedIn — ${leftLabelWord}`,
            ariaLabel: `لينكدإن ${leftLabelWord} (يسار)`,
            icon: liIcon,
            bg: "bg-[#0A66C2]",
          },
          {
            href: homepageSettings.teamFacebookUrl?.trim() || null,
            label: `${leftLabelWord} (Facebook)`,
            title: `فيسبوك — ${leftLabelWord}`,
            ariaLabel: `فيسبوك ${leftLabelWord} (يسار)`,
            icon: fbIcon,
            bg: "bg-[#1877F2]",
          },
          {
            href: homepageSettings.teamWhatsappUrl?.trim() || null,
            label: `${leftLabelWord} (WhatsApp)`,
            title: `واتساب — ${leftLabelWord}`,
            ariaLabel: `واتساب ${leftLabelWord} (يسار)`,
            icon: waIcon,
            bg: "bg-[#25D366]",
          },
          {
            href: homepageSettings.teamTelegramUrl?.trim() || null,
            label: `${leftLabelWord} (Telegram)`,
            title: `Telegram — ${leftLabelWord}`,
            ariaLabel: `تليجرام ${leftLabelWord} (يسار)`,
            icon: tgIcon,
            bg: "bg-[#229ED9]",
          },
        ].filter((item) => item.href)
          : [];

        return (
          <>
            {rightLinks.map((item, idx) => (
              <a
                key={`right-${item.label}`}
                href={item.href!}
                target="_blank"
                rel="noopener noreferrer"
                className={`${baseBtn} ${verticalPositions[Math.min(idx, verticalPositions.length - 1)]} right-4 md:right-6`}
                aria-label={item.ariaLabel}
                title={item.title}
              >
                <span className={`${circle} ${item.bg}`}>{item.icon}</span>
                <span className={label}>{item.label}</span>
              </a>
            ))}
            {leftLinks.map((item, idx) => (
              <a
                key={`left-${item.label}`}
                href={item.href!}
                target="_blank"
                rel="noopener noreferrer"
                className={`${baseBtn} ${verticalPositions[Math.min(idx, verticalPositions.length - 1)]} left-4 md:left-6`}
                aria-label={item.ariaLabel}
                title={item.title}
              >
                <span className={`${circle} ${item.bg}`}>{item.icon}</span>
                <span className={label}>{item.label}</span>
              </a>
            ))}
          </>
        );
      })()}
    </>
  );
}

export function HomePageBelowFoldFallback() {
  return (
    <div className="min-h-[40vh] animate-pulse bg-[var(--color-surface)]" aria-busy="true" aria-label="Loading content">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-16 sm:px-6">
        <div className="h-8 w-48 rounded bg-[var(--color-border)]" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-[var(--radius-card)] bg-[var(--color-border)]/60" />
          ))}
        </div>
      </div>
    </div>
  );
}
