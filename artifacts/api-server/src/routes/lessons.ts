import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, lessonsTable, coursesTable, lessonProgressTable } from "@workspace/db";
import { ListLessonsResponse, CreateLessonResponse, CompleteLessonResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// List lessons for a course
router.get("/courses/:courseId/lessons", async (req, res): Promise<void> => {
  const courseId = parseInt(Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId, 10);
  const lessons = await db.select().from(lessonsTable)
    .where(eq(lessonsTable.courseId, courseId))
    .orderBy(lessonsTable.orderIndex);

  let completedIds = new Set<number>();
  if (req.isAuthenticated()) {
    const progress = await db.select().from(lessonProgressTable)
      .where(and(eq(lessonProgressTable.userId, req.user.id), eq(lessonProgressTable.completed, true)));
    completedIds = new Set(progress.map(p => p.lessonId));
  }

  res.json(ListLessonsResponse.parse(lessons.map(l => ({ ...l, completed: completedIds.has(l.id) }))));
});

// Create lesson
router.post("/courses/:courseId/lessons", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const courseId = parseInt(Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId, 10);
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!course) { res.status(404).json({ error: "Course not found" }); return; }
  if (course.instructorId !== req.user.id) { res.status(403).json({ error: "Forbidden" }); return; }
  const { title, videoUrl, description, orderIndex } = req.body;
  if (!title || !videoUrl) { res.status(400).json({ error: "title and videoUrl required" }); return; }
  const [lesson] = await db.insert(lessonsTable).values({
    courseId, title, videoUrl, description: description ?? null, orderIndex: orderIndex ?? 0,
  }).returning();
  res.status(201).json(CreateLessonResponse.parse({ ...lesson, completed: false }));
});

// Delete lesson
router.delete("/lessons/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, id));
  if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, lesson.courseId));
  if (!course || course.instructorId !== req.user.id) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(lessonsTable).where(eq(lessonsTable.id, id));
  res.sendStatus(204);
});

// Mark lesson complete
router.post("/lessons/:id/complete", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const lessonId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [existing] = await db.select().from(lessonProgressTable)
    .where(and(eq(lessonProgressTable.userId, req.user.id), eq(lessonProgressTable.lessonId, lessonId)));
  if (existing) {
    const [updated] = await db.update(lessonProgressTable)
      .set({ completed: true, completedAt: new Date() })
      .where(and(eq(lessonProgressTable.userId, req.user.id), eq(lessonProgressTable.lessonId, lessonId)))
      .returning();
    res.json(CompleteLessonResponse.parse({ lessonId: updated.lessonId, completed: updated.completed }));
  } else {
    await db.insert(lessonProgressTable).values({ userId: req.user.id, lessonId, completed: true, completedAt: new Date() });
    res.json(CompleteLessonResponse.parse({ lessonId, completed: true }));
  }
});

export default router;
