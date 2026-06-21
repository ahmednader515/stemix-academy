"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/LocaleProvider";

export function BeHeaderSearch() {
  const t = useT();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/courses?q=${encodeURIComponent(q)}` : "/courses");
  }

  return (
    <form onSubmit={handleSubmit} className="relative hidden min-w-0 flex-1 md:flex md:max-w-md lg:max-w-lg">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("beHome.headerSearchPlaceholder", "Course name or subject code")}
        className="w-full rounded-full border border-[var(--be-border,#e2e8f0)] bg-slate-50 py-2 pe-12 ps-4 text-sm outline-none focus:border-[var(--be-navy,#0c3d7a)]"
      />
      <button
        type="submit"
        className="absolute end-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--be-navy,#0c3d7a)] text-white"
        aria-label={t("beHome.search", "Search")}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </form>
  );
}
