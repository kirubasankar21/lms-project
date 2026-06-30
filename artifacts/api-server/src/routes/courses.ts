import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, coursesTable, usersTable, enrollmentsTable, lessonsTable } from "@workspace/db";
import { ListCoursesResponse, GetCourseResponse, CreateCourseResponse, UpdateCourseResponse } from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichCourse(course: typeof coursesTable.$inferSelect) {
  const [instructor] = await db.select().from(usersTable).where(eq(usersTable.id, course.instructorId));
  const [{ count: lessonCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(lessonsTable).where(eq(lessonsTable.courseId, course.id));
  const [{ count: enrollmentCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(enrollmentsTable).where(eq(enrollmentsTable.courseId, course.id));
  const instructorName = instructor ? [instructor.firstName, instructor.lastName].filter(Boolean).join(" ") || "Instructor" : null;
  return {
    ...course,
    price: course.price != null ? Number(course.price) : null,
    instructorName,
    lessonCount: lessonCount ?? 0,
    enrollmentCount: enrollmentCount ?? 0,
  };
}

// List courses
router.get("/courses", async (req, res): Promise<void> => {
  const instructorId = req.query.instructorId as string | undefined;
  const courses = instructorId
    ? await db.select().from(coursesTable).where(eq(coursesTable.instructorId, instructorId)).orderBy(coursesTable.createdAt)
    : await db.select().from(coursesTable).orderBy(coursesTable.createdAt);
  const enriched = await Promise.all(courses.map(enrichCourse));
  res.json(ListCoursesResponse.parse(enriched));
});

// Create course
router.post("/courses", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
  if (!me || (me.role !== "instructor" && me.role !== "admin")) {
    res.status(403).json({ error: "Only instructors can create courses" }); return;
  }
  const { title, description, thumbnailUrl, price, isFree } = req.body;
  if (!title || !description) { res.status(400).json({ error: "title and description required" }); return; }
  const [course] = await db.insert(coursesTable).values({
    title,
    description,
    thumbnailUrl: thumbnailUrl ?? null,
    instructorId: req.user.id,
    price: price != null ? String(price) : null,
    isFree: isFree ?? !price,
  }).returning();
  res.status(201).json(CreateCourseResponse.parse(await enrichCourse(course)));
});

// Get course by id
router.get("/courses/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
  if (!course) { res.status(404).json({ error: "Course not found" }); return; }
  res.json(GetCourseResponse.parse(await enrichCourse(course)));
});

// Update course
router.patch("/courses/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [existing] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Course not found" }); return; }
  if (existing.instructorId !== req.user.id) {
    const [me] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
    if (!me || me.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  }
  const { title, description, thumbnailUrl, price, isFree } = req.body;
  const [updated] = await db.update(coursesTable).set({
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(thumbnailUrl !== undefined && { thumbnailUrl }),
    ...(price !== undefined && { price: String(price) }),
    ...(isFree !== undefined && { isFree }),
  }).where(eq(coursesTable.id, id)).returning();
  res.json(UpdateCourseResponse.parse(await enrichCourse(updated)));
});

// Delete course
router.delete("/courses/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [existing] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Course not found" }); return; }
  if (existing.instructorId !== req.user.id) {
    const [me] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
    if (!me || me.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  }
  await db.delete(coursesTable).where(eq(coursesTable.id, id));
  res.sendStatus(204);
});

export default router;
