import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, enrollmentsTable, coursesTable, lessonsTable, lessonProgressTable } from "@workspace/db";
import { ListMyEnrollmentsResponse, EnrollInCourseResponse, GetCourseProgressResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// Get course progress
router.get("/enrollments/course/:courseId/progress", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const courseId = parseInt(Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId, 10);
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(lessonsTable).where(eq(lessonsTable.courseId, courseId));
  const [{ completed }] = await db.select({ completed: sql<number>`count(*)::int` })
    .from(lessonProgressTable)
    .innerJoin(lessonsTable, eq(lessonProgressTable.lessonId, lessonsTable.id))
    .where(and(eq(lessonsTable.courseId, courseId), eq(lessonProgressTable.userId, req.user.id), eq(lessonProgressTable.completed, true)));
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  res.json(GetCourseProgressResponse.parse({ courseId, totalLessons: total, completedLessons: completed, progressPercent }));
});

// List my enrollments
router.get("/enrollments", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const enrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.userId, req.user.id));
  const enriched = await Promise.all(enrollments.map(async (e) => {
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, e.courseId));
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(lessonsTable).where(eq(lessonsTable.courseId, e.courseId));
    const [{ completed }] = await db.select({ completed: sql<number>`count(*)::int` })
      .from(lessonProgressTable)
      .innerJoin(lessonsTable, eq(lessonProgressTable.lessonId, lessonsTable.id))
      .where(and(eq(lessonsTable.courseId, e.courseId), eq(lessonProgressTable.userId, req.user.id), eq(lessonProgressTable.completed, true)));
    const progressPercent = (total as number) > 0 ? Math.round(((completed as number) / (total as number)) * 100) : 0;
    return { ...e, courseTitle: course?.title ?? null, courseThumbnailUrl: course?.thumbnailUrl ?? null, progressPercent };
  }));
  res.json(ListMyEnrollmentsResponse.parse(enriched));
});

// Enroll in course
router.post("/enrollments", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { courseId } = req.body;
  if (!courseId) { res.status(400).json({ error: "courseId required" }); return; }
  const [existing] = await db.select().from(enrollmentsTable)
    .where(and(eq(enrollmentsTable.userId, req.user.id), eq(enrollmentsTable.courseId, courseId)));
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (existing) {
    res.status(200).json(EnrollInCourseResponse.parse({ ...existing, courseTitle: course?.title ?? null, courseThumbnailUrl: course?.thumbnailUrl ?? null, progressPercent: 0 }));
    return;
  }
  const [enrollment] = await db.insert(enrollmentsTable).values({ userId: req.user.id, courseId }).returning();
  res.status(201).json(EnrollInCourseResponse.parse({ ...enrollment, courseTitle: course?.title ?? null, courseThumbnailUrl: course?.thumbnailUrl ?? null, progressPercent: 0 }));
});

// Unenroll from course
router.delete("/enrollments/:courseId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const courseId = parseInt(Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId, 10);
  await db.delete(enrollmentsTable).where(and(eq(enrollmentsTable.userId, req.user.id), eq(enrollmentsTable.courseId, courseId)));
  res.sendStatus(204);
});

export default router;
