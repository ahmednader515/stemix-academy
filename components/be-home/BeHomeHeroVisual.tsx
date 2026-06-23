import Image from "next/image";
import { Cairo } from "next/font/google";
import type { ReactNode } from "react";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

type Props = {
  imageUrl: string;
  imageAlt: string;
};

type DiamondTile = {
  id: string;
  variant: "navy" | "gold" | "gold-dark-text" | "outline";
  size: "sm" | "md" | "lg";
  className: string;
  content: ReactNode;
};

const TILES: DiamondTile[] = [
  {
    id: "exams",
    variant: "navy",
    size: "lg",
    className: "be-hero-tile--exams",
    content: (
      <>
        حل الامتحانات
        <br />
        السابقة
      </>
    ),
  },
  {
    id: "homework",
    variant: "gold",
    size: "md",
    className: "be-hero-tile--homework",
    content: (
      <>
        شرح الواجبات
        <br />
        والمساعدة في حلها
      </>
    ),
  },
  {
    id: "courses",
    variant: "navy",
    size: "sm",
    className: "be-hero-tile--courses",
    content: (
      <>
        <span className="be-hero-tile__stat">+350</span>
        <span className="be-hero-tile__stat-label">دورة</span>
      </>
    ),
  },
  {
    id: "support",
    variant: "gold-dark-text",
    size: "md",
    className: "be-hero-tile--support",
    content: (
      <>
        دعم مباشر لآخر
        <br />
        دقيقة قبل
        <br />
        الامتحان
      </>
    ),
  },
  {
    id: "evaluations",
    variant: "gold",
    size: "md",
    className: "be-hero-tile--evaluations",
    content: (
      <>
        تقييمات
        <br />
        دورية
      </>
    ),
  },
  {
    id: "reviews",
    variant: "outline",
    size: "md",
    className: "be-hero-tile--reviews",
    content: (
      <>
        مراجعات شاملة
        <br />
        قبل الاختبار
      </>
    ),
  },
  {
    id: "students",
    variant: "gold-dark-text",
    size: "md",
    className: "be-hero-tile--students",
    content: (
      <>
        <span className="be-hero-tile__stat">+4K</span>
        <span className="be-hero-tile__stat-label">طالب/ة</span>
      </>
    ),
  },
];

function BeHeroDiamond({ content, variant, size, className }: Omit<DiamondTile, "id">) {
  return (
    <div className={`be-hero-tile ${className} be-hero-tile--${variant} be-hero-tile--${size}`}>
      <div className="be-hero-tile__diamond">
        <div className="be-hero-tile__text">{content}</div>
      </div>
    </div>
  );
}

/** هيرو بصري — ماسة مركزية مع مربعات دوّارة حولها (مطابق لتصميم المرجع) */
export function BeHomeHeroVisual({ imageUrl, imageAlt }: Props) {
  return (
    <div className={`be-hero-visual ${cairo.className}`} dir="rtl">
      <div className="be-hero-visual__bg" aria-hidden />
      <div className="be-hero-visual__stage">
        <div className="be-hero-visual__center">
          <div className="be-hero-visual__center-diamond">
            <div className="be-hero-visual__center-inner">
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 70vw, 300px"
              />
            </div>
          </div>
        </div>

        {TILES.map((tile) => (
          <BeHeroDiamond key={tile.id} {...tile} />
        ))}

        <span className="be-hero-dot be-hero-dot--1" aria-hidden />
        <span className="be-hero-dot be-hero-dot--2" aria-hidden />
        <span className="be-hero-dot be-hero-dot--3" aria-hidden />
        <span className="be-hero-dot be-hero-dot--4" aria-hidden />
      </div>
    </div>
  );
}
