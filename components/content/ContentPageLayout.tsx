import type { ReactNode } from "react";

type ContentSection = {
  title: string;
  body: ReactNode;
};

type ContentPageLayoutProps = {
  eyebrow?: string;
  title: string;
  intro: ReactNode;
  sections: ContentSection[];
  updatedAt?: string;
};

export function ContentPageLayout({
  eyebrow,
  title,
  intro,
  sections,
  updatedAt,
}: ContentPageLayoutProps) {
  return (
    <main className="mx-auto w-full max-w-[900px] px-4 pb-20 pt-10 sm:px-6 sm:pb-24 sm:pt-14 lg:px-8">
      <header className="rounded-2xl bg-[radial-gradient(circle_at_18%_0%,rgba(16,185,129,0.14),transparent_46%),linear-gradient(180deg,#ffffff_0%,#f7fbf8_100%)] px-6 py-8 sm:px-8 sm:py-10">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          {title}
        </h1>
        <div className="mt-4 text-sm leading-7 text-text-secondary sm:text-base sm:leading-8">
          {intro}
        </div>
        {updatedAt ? (
          <p className="mt-5 text-xs font-medium text-text-secondary/80">
            Son güncelleme: {updatedAt}
          </p>
        ) : null}
      </header>

      <div className="mt-10 space-y-8 sm:mt-12 sm:space-y-10">
        {sections.map((section, index) => (
          <section
            key={section.title}
            className="rounded-xl border border-divider-softLight bg-white/85 px-5 py-6 shadow-sm sm:px-6 sm:py-7"
          >
            <h2 className="text-lg font-semibold tracking-tight text-text-primary sm:text-xl">
              {index + 1}. {section.title}
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-7 text-text-secondary sm:text-[15px] sm:leading-8">
              {section.body}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
