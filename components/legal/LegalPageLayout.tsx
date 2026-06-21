import Link from "next/link";

type Section = {
  title: string;
  paragraphs: string[];
  list?: string[];
};

type Props = {
  title: string;
  intro: string;
  updatedLabel: string;
  updatedDate: string;
  sections: Section[];
  backLabel: string;
};

export function LegalPageLayout({
  title,
  intro,
  updatedLabel,
  updatedDate,
  sections,
  backLabel,
}: Props) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/"
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        ← {backLabel}
      </Link>

      <article className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
        <header>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">{intro}</p>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            {updatedLabel}: {updatedDate}
          </p>
        </header>

        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--color-foreground)]/90">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
                {section.list?.length ? (
                  <ul className="list-disc space-y-2 pr-5">
                    {section.list.map((item) => (
                      <li key={item.slice(0, 40)}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
