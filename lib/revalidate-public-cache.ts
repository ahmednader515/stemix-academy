import { revalidateTag } from "next/cache";

/** TTL for public catalog data cached via unstable_cache (seconds). */
export const PUBLIC_DATA_REVALIDATE_SECONDS = 60;

export const PUBLIC_CACHE_TAGS = {
  courses: "public-courses",
  categories: "public-categories",
  reviews: "public-reviews",
  teachers: "public-teachers",
  homepage: "public-homepage",
  subscriptions: "public-subscriptions",
} as const;

/** Invalidate cached public pages after admin edits to courses, homepage, etc. */
export function revalidatePublicCatalogCache() {
  for (const tag of Object.values(PUBLIC_CACHE_TAGS)) {
    revalidateTag(tag, "max");
  }
}
