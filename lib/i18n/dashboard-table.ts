import { getDir } from "@/lib/i18n/core";
import { DEFAULT_LOCALE } from "@/lib/i18n/constants";
import type { Locale } from "@/lib/i18n/types";

export function useDashboardTable() {
  const locale: Locale = DEFAULT_LOCALE;
  const dir = getDir();
  return {
    locale,
    dir,
    thClass: "px-4 py-3 text-start text-xs font-medium text-[var(--color-muted)]",
    thClassCompact: "px-3 py-2 text-start text-xs font-medium text-[var(--color-muted)]",
  };
}

export function dateLocaleForUi(_locale?: Locale): string {
  return "ar-EG";
}
