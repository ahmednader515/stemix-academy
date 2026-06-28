"use client";

import { BeCourseCard } from "./BeCourseCard";
import { CoursesCarousel, CoursesCarouselItem } from "@/components/CoursesCarousel";

type CourseItem = Parameters<typeof BeCourseCard>[0]["course"];

export function BeHomeCoursesCarousel({ courses }: { courses: CourseItem[] }) {
  if (courses.length === 0) return null;

  return (
    <CoursesCarousel>
      {courses.map((course) => (
        <CoursesCarouselItem key={course.id}>
          <BeCourseCard course={course} />
        </CoursesCarouselItem>
      ))}
    </CoursesCarousel>
  );
}
