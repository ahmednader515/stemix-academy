"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

export type HeroStatItem = {
  value: string;
  label: string;
};

function StatGroup({ stats, groupId }: { stats: HeroStatItem[]; groupId: string }) {
  return (
    <div className="be-hero-stats-carousel__group" aria-hidden={groupId === "b" ? true : undefined}>
      {stats.map((stat, index) => (
        <div key={`${groupId}-${stat.label}-${index}`} className="be-hero-stats-carousel__cell">
          {index > 0 ? <div className="be-hero-stats-carousel__divider" aria-hidden /> : null}
          <div className="be-hero-stats-carousel__item" dir="rtl">
            <p className="be-hero-stats-carousel__value">{stat.value}</p>
            <p className="be-hero-stats-carousel__label">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** شريط إحصائيات متحرك بلا توقف — حلقة لا نهائية */
export function BeHomeHeroStatsCarousel({ stats }: { stats: HeroStatItem[] }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [cellWidth, setCellWidth] = useState<number | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const update = () => {
      const width = frame.clientWidth;
      if (width > 0) setCellWidth(width / 3);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  if (stats.length === 0) return null;

  const frameStyle: CSSProperties | undefined =
    cellWidth != null ? { ["--hero-stat-cell-width" as string]: `${cellWidth}px` } : undefined;

  return (
    <div className="be-hero-stats-carousel">
      <div ref={frameRef} className="be-hero-stats-carousel__frame" style={frameStyle}>
        <div className="be-hero-stats-carousel__track">
          <StatGroup stats={stats} groupId="a" />
          <StatGroup stats={stats} groupId="b" />
        </div>
      </div>
    </div>
  );
}
