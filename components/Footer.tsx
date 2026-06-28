import Link from "next/link";
import { getServerTranslator } from "@/lib/i18n/server";

export async function Footer({
  footerTitle,
  footerTagline,
  footerCopyright,
  whatsappUrl,
  facebookUrl,
  youtubeUrl,
  tiktokUrl,
  instagramUrl,
}: {
  footerTitle?: string;
  footerTagline?: string;
  footerCopyright?: string;
  whatsappUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
  instagramUrl?: string | null;
}) {
  const t = await getServerTranslator();
  const defaultTitle = t("footer.defaultTitle", "My Learning Platform");
  const defaultTagline = t("footer.defaultTagline", "Learn with a modern and clear method");
  const defaultCopyright = t("footer.defaultCopyright", "My Learning Platform. All rights reserved.");
  const year = new Date().getFullYear();
  const copyrightText = footerCopyright?.trim() || defaultCopyright;
  const title = footerTitle?.trim() || defaultTitle;
  const tagline = footerTagline?.trim() || defaultTagline;

  const social = [
    { href: facebookUrl, label: "Facebook" },
    { href: whatsappUrl, label: "WhatsApp" },
    { href: youtubeUrl, label: "YouTube" },
    { href: tiktokUrl, label: "TikTok" },
    { href: instagramUrl, label: "Instagram" },
  ].filter((s) => s.href?.trim());

  return (
    <footer className="be-footer mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-bold">{title}</p>
            <p className="mt-3 text-sm leading-relaxed text-white/80">{tagline}</p>
            {social.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {social.map((s) => (
                  <a
                    key={s.label}
                    href={s.href!.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-white/25 px-3 py-1.5 text-xs font-medium text-white/90 hover:bg-white/10"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <p className="font-bold">{t("beHome.footerQuickLinks", "Quick links")}</p>
            <ul className="mt-3 space-y-2 text-sm text-white/85">
              <li>
                <Link href="/courses" className="hover:text-white">
                  {t("common.courses", "Courses")}
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white">
                  {t("header.register", "Create account")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-bold">{t("beHome.footerSupport", "Support")}</p>
            <p className="mt-3 text-sm text-white/80">{t("beHome.footerSupportText", "Need help? Contact us through the platform support channels.")}</p>
            <ul className="mt-3 space-y-2 text-sm text-white/85">
              <li>
                <Link href="/privacy-policy" className="hover:text-white">
                  {t("legal.privacy.title", "سياسة الخصوصية")}
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-white">
                  {t("legal.refund.title", "سياسة الاسترداد")}
                </Link>
              </li>
            </ul>
            {whatsappUrl?.trim() ? (
              <a
                href={whatsappUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block rounded-lg border border-white/30 px-4 py-2 text-sm font-medium hover:bg-white/10"
              >
                {t("beHome.footerWhatsapp", "WhatsApp support")}
              </a>
            ) : null}
          </div>

          <div>
            <p className="font-bold">{t("beHome.footerContact", "Contact")}</p>
            <div className="mt-3 space-y-2 text-sm text-white/85">
              <p>{title}</p>
              <Link href="/" className="block hover:text-white">
                {t("common.home", "Home")}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/20 pt-8 text-sm text-white/70 sm:flex-row">
          <p>© {year} {copyrightText}</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="hover:text-white">{t("common.home", "Home")}</Link>
            <Link href="/courses" className="hover:text-white">{t("common.courses", "Courses")}</Link>
            <Link href="/privacy-policy" className="hover:text-white">{t("legal.privacy.title", "سياسة الخصوصية")}</Link>
            <Link href="/refund-policy" className="hover:text-white">{t("legal.refund.title", "سياسة الاسترداد")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
