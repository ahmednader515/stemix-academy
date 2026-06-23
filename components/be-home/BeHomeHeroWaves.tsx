/** خلفية موجات الهيرو — مطابقة لنمط المرجع (شرائط منحنية فاتحة) */
export function BeHomeHeroWaves() {
  return (
    <div className="be-hero-waves" aria-hidden>
      <svg
        className="be-hero-waves__svg"
        viewBox="0 0 1440 720"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="be-hero-wave-fill-a" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3f6fa" />
            <stop offset="100%" stopColor="#eef2f7" />
          </linearGradient>
          <linearGradient id="be-hero-wave-fill-b" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#f7f9fc" />
            <stop offset="100%" stopColor="#eceff4" />
          </linearGradient>
        </defs>

        {/* منطقة ممتلئة علوية-يسرى */}
        <path
          d="M-120 40 C 220 -20, 420 120, 620 60 C 860 -10, 1020 90, 1280 20 L 1440 0 L 1440 280 L 980 340 C 720 390, 460 300, 220 360 C 40 400, -80 320, -120 260 Z"
          fill="url(#be-hero-wave-fill-a)"
          opacity="0.95"
        />

        {/* شريط منحني وسط */}
        <path
          d="M-80 300 C 180 220, 380 380, 620 300 C 880 210, 1080 350, 1320 270 L 1520 250 L 1520 430 C 1240 470, 980 390, 700 450 C 420 510, 180 420, -80 480 Z"
          fill="url(#be-hero-wave-fill-b)"
          opacity="0.75"
        />

        {/* موجة سفلية-يمنى */}
        <path
          d="M320 520 C 560 440, 780 560, 1020 480 C 1180 420, 1320 500, 1520 440 L 1520 720 L 180 720 C 120 640, 220 580, 320 520 Z"
          fill="#f1f4f8"
          opacity="0.85"
        />

        {/* خطوط منحنية رفيعة مثل المرجع */}
        <path
          d="M-40 130 C 200 50, 420 190, 680 110 S 1120 170, 1480 90"
          fill="none"
          stroke="#d8e0ea"
          strokeWidth="1.2"
          opacity="0.9"
        />
        <path
          d="M-60 210 C 240 120, 460 260, 720 180 S 1160 240, 1500 160"
          fill="none"
          stroke="#dfe6ef"
          strokeWidth="1"
          opacity="0.85"
        />
        <path
          d="M80 390 C 300 310, 520 430, 760 350 S 1180 410, 1460 330"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
          opacity="0.8"
        />
        <path
          d="M40 470 C 280 390, 500 510, 740 430 S 1200 490, 1480 410"
          fill="none"
          stroke="#d9e1eb"
          strokeWidth="1.1"
          opacity="0.75"
        />
        <path
          d="M120 560 C 360 480, 580 600, 820 520 S 1240 580, 1480 500"
          fill="none"
          stroke="#e5eaf0"
          strokeWidth="0.9"
          opacity="0.7"
        />

        {/* قوس خفيف إضافي */}
        <path
          d="M900 40 C 1040 120, 1180 60, 1440 140 L 1440 0 L 900 0 Z"
          fill="#f6f8fb"
          opacity="0.6"
        />
      </svg>
    </div>
  );
}
