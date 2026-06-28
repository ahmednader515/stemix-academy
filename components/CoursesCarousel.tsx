"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import "./courses-carousel.css";

export function CoursesCarousel({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const childCount = Array.isArray(children) ? children.length : children ? 1 : 0;

  const updatePagination = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 0) {
      setPageCount(1);
      setActivePage(0);
      return;
    }
    const pages = Math.max(1, Math.ceil(maxScroll / track.clientWidth) + 1);
    setPageCount(pages);
    const page = Math.round((track.scrollLeft / maxScroll) * (pages - 1));
    setActivePage(page);
  }, []);

  useEffect(() => {
    updatePagination();
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", updatePagination, { passive: true });
    window.addEventListener("resize", updatePagination);
    return () => {
      track.removeEventListener("scroll", updatePagination);
      window.removeEventListener("resize", updatePagination);
    };
  }, [childCount, updatePagination]);

  const scrollToPage = (page: number) => {
    const track = trackRef.current;
    if (!track) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 0) return;
    const target = pageCount <= 1 ? 0 : (page / (pageCount - 1)) * maxScroll;
    track.scrollTo({ left: target, behavior: "smooth" });
  };

  if (childCount === 0) return null;

  return (
    <div>
      <div ref={trackRef} className="courses-carousel-track">
        {children}
      </div>
      {pageCount > 1 ? (
        <div className="courses-carousel-dots" role="tablist" aria-label="Carousel pagination">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === activePage}
              aria-label={`Page ${i + 1}`}
              className={`courses-carousel-dot${i === activePage ? " is-active" : ""}`}
              onClick={() => scrollToPage(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CoursesCarouselItem({ children }: { children: ReactNode }) {
  return <div className="courses-carousel-item">{children}</div>;
}
