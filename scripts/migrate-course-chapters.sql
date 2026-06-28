-- ============================================================
-- ترحيل: إنشاء فصل افتراضي للدورات الحالية وربط الحصص/الاختبارات
-- شغّل مرة واحدة بعد إضافة جدول CourseChapter
-- ============================================================

INSERT INTO "CourseChapter" (id, course_id, title, title_ar, "order")
SELECT
  'ch-' || c.id,
  c.id,
  'Chapter 1',
  'الفصل الأول',
  0
FROM "Course" c
WHERE NOT EXISTS (SELECT 1 FROM "CourseChapter" ch WHERE ch.course_id = c.id)
  AND (
    EXISTS (SELECT 1 FROM "Lesson" l WHERE l.course_id = c.id)
    OR EXISTS (SELECT 1 FROM "Quiz" q WHERE q.course_id = c.id)
  );

UPDATE "Lesson" l
SET chapter_id = 'ch-' || l.course_id
WHERE l.chapter_id IS NULL
  AND EXISTS (SELECT 1 FROM "CourseChapter" ch WHERE ch.id = 'ch-' || l.course_id);

UPDATE "Quiz" q
SET chapter_id = 'ch-' || q.course_id
WHERE q.chapter_id IS NULL
  AND EXISTS (SELECT 1 FROM "CourseChapter" ch WHERE ch.id = 'ch-' || q.course_id);
