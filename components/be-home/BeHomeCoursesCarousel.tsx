"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BeCourseCard } from "./BeCourseCard";

type CourseItem = Parameters<typeof BeCourseCard>[0]["course"];

export function BeHomeCoursesCarousel({ courses }: { courses: CourseItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  const [pageCount, setPageCount] = useState(1);

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
  }, [courses.length, updatePagination]);

  const scrollToPage = (page: number) => {
    const track = trackRef.current;
    if (!track) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 0) return;
    const target = pageCount <= 1 ? 0 : (page / (pageCount - 1)) * maxScroll;
    track.scrollTo({ left: target, behavior: "smooth" });
  };

  if (courses.length === 0) return null;

  return (
    <div>
      <div ref={trackRef} className="be-carousel-track">
        {courses.map((course) => (
          <div key={course.id} className="be-carousel-item">
            <BeCourseCard course={course} />
          </div>
        ))}
      </div>
      {pageCount > 1 ? (
        <div className="be-carousel-dots" aria-hidden={pageCount <= 1}>
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`be-carousel-dot${i === activePage ? " is-active" : ""}`}
              aria-label={`Page ${i + 1}`}
              onClick={() => scrollToPage(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
