import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, assignmentsTable, submissionsTable, coursesTable, usersTable } from "@workspace/db";
import { ListAssignmentsResponse, CreateAssignmentResponse, ListSubmissionsResponse, SubmitAssignmentResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// List assignments
router.get("/courses/:courseId/assignments", async (req, res): Promise<void> => {
  const courseId = parseInt(Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId, 10);
  const assignments = await db.select().from(assignmentsTable).where(eq(assignmentsTable.courseId, courseId)).orderBy(assignmentsTable.createdAt);
  res.json(ListAssignmentsResponse.parse(assignments));
});

// Create assignment
router.post("/courses/:courseId/assignments", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const courseId = parseInt(Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId, 10);
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!course || course.instructorId !== req.user.id) { res.status(403).json({ error: "Forbidden" }); return; }
  const { title, description, dueDate } = req.body;
  if (!title || !description) { res.status(400).json({ error: "title and description required" }); return; }
  const [assignment] = await db.insert(assignmentsTable).values({ courseId, title, description, dueDate: dueDate ?? null }).returning();
  res.status(201).json(CreateAssignmentResponse.parse(assignment));
});

// List submissions for assignment
router.get("/assignments/:id/submissions", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const submissions = await db.select().from(submissionsTable).where(eq(submissionsTable.assignmentId, id));
  const enriched = await Promise.all(submissions.map(async s => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, s.userId)).limit(1);
    const userName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "User" : null;
    return { ...s, userName };
  }));
  res.json(ListSubmissionsResponse.parse(enriched));
});

// Submit assignment
router.post("/assignments/:id/submissions", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const assignmentId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { answer, fileUrl } = req.body;
  if (answer == null) { res.status(400).json({ error: "answer required" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);
  const [submission] = await db.insert(submissionsTable).values({ assignmentId, userId: req.user.id, answer, fileUrl: fileUrl ?? null }).returning();
  const userName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "User" : null;
  res.status(201).json(SubmitAssignmentResponse.parse({ ...submission, userName }));
});

export default router;
