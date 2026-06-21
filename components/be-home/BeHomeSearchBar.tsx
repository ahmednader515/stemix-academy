"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/LocaleProvider";

type CategoryOption = { slug: string; label: string };

export function BeHomeSearchBar({ categories }: { categories: CategoryOption[] }) {
  const t = useT();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    const q = query.trim();
    if (q) params.set("q", q);
    router.push(`/courses${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-6xl flex-col gap-3 rounded-2xl border border-[var(--be-border)] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-3"
    >
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("beHome.searchPlaceholder", "Search by course name or subject code")}
        className="min-w-0 flex-1 rounded-xl border border-[var(--be-border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--be-navy)]"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="rounded-xl border border-[var(--be-border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--be-navy)] sm:max-w-[11rem]"
        aria-label={t("beHome.categoryFilter", "Category")}
      >
        <option value="">{t("beHome.allCategories", "All categories")}</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.label}
          </option>
        ))}
      </select>
      <button type="submit" className="be-btn-primary flex shrink-0 items-center justify-center gap-2 px-6 py-2.5 text-sm">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {t("beHome.search", "Search")}
      </button>
    </form>
  );
}
