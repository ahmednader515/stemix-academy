import Image from "next/image";
import { almarai } from "@/lib/fonts";

type Props = {
  imageUrl: string;
  imageAlt: string;
};

type BentoCard = {
  id: string;
  icon: string;
  title: string;
  subtitle?: string;
  variant: "navy" | "amber" | "sky" | "white";
  className: string;
};

const CARDS: BentoCard[] = [
  {
    id: "exams",
    icon: "📋",
    title: "حل الامتحانات",
    subtitle: "السابقة",
    variant: "navy",
    className: "be-hero-bento__card--exams",
  },
  {
    id: "homework",
    icon: "✏️",
    title: "شرح الواجبات",
    subtitle: "ومساعدة في حلها",
    variant: "amber",
    className: "be-hero-bento__card--homework",
  },
  {
    id: "courses",
    icon: "📚",
    title: "+350",
    subtitle: "دورة",
    variant: "sky",
    className: "be-hero-bento__card--courses",
  },
  {
    id: "support",
    icon: "💬",
    title: "دعم مباشر",
    subtitle: "قبل الامتحان",
    variant: "amber",
    className: "be-hero-bento__card--support",
  },
  {
    id: "evaluations",
    icon: "⭐",
    title: "تقييمات",
    subtitle: "دورية",
    variant: "white",
    className: "be-hero-bento__card--evaluations",
  },
  {
    id: "reviews",
    icon: "📝",
    title: "مراجعات شاملة",
    subtitle: "قبل الاختبار",
    variant: "white",
    className: "be-hero-bento__card--reviews",
  },
  {
    id: "students",
    icon: "👥",
    title: "+4K",
    subtitle: "طالب/ة",
    variant: "navy",
    className: "be-hero-bento__card--students",
  },
];

function BentoFeatureCard({ icon, title, subtitle, variant, className }: Omit<BentoCard, "id">) {
  return (
    <div className={`be-hero-bento__card be-hero-bento__card--${variant} ${className}`}>
      <span className="be-hero-bento__icon" aria-hidden>
        {icon}
      </span>
      <div className="be-hero-bento__card-text">
        <p className="be-hero-bento__card-title">{title}</p>
        {subtitle ? <p className="be-hero-bento__card-sub">{subtitle}</p> : null}
      </div>
    </div>
  );
}

/** Bento-grid hero visual — rounded cards instead of rotated diamonds */
export function BeHomeHeroVisual({ imageUrl, imageAlt }: Props) {
  return (
    <div className={`be-hero-bento ${almarai.className}`} dir="rtl">
      <div className="be-hero-bento__frame">
        <div className="be-hero-bento__main">
          <div className="be-hero-bento__main-inner">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 85vw, 420px"
            />
            <div className="be-hero-bento__main-shine" aria-hidden />
          </div>
        </div>

        {CARDS.map((card) => (
          <BentoFeatureCard key={card.id} {...card} />
        ))}
      </div>
    </div>
  );
}
