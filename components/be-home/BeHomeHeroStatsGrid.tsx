import type { HeroStatItem } from "./BeHomeHeroStatsCarousel";
import { tajawal } from "@/lib/fonts";

export type { HeroStatItem };

/** Static stat chips for the redesigned hero */
export function BeHomeHeroStatsGrid({ stats }: { stats: HeroStatItem[] }) {
  if (stats.length === 0) return null;

  return (
    <div className={`be-hero-stats-grid ${tajawal.className}`}>
      {stats.map((stat) => (
        <div key={stat.label} className="be-hero-stats-grid__item" dir="rtl">
          <p className="be-hero-stats-grid__value">{stat.value}</p>
          <p className="be-hero-stats-grid__label">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
