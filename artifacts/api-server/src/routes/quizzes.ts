import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, quizzesTable, coursesTable } from "@workspace/db";
import { ListQuizzesResponse, CreateQuizResponse, SubmitQuizResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// List quizzes (hide correct answers)
router.get("/courses/:courseId/quizzes", async (req, res): Promise<void> => {
  const courseId = parseInt(Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId, 10);
  const quizzes = await db.select().from(quizzesTable).where(eq(quizzesTable.courseId, courseId)).orderBy(quizzesTable.createdAt);
  res.json(ListQuizzesResponse.parse(quizzes.map(q => ({
    id: q.id, courseId: q.courseId, question: q.question,
    optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD, createdAt: q.createdAt,
  }))));
});

// Create quiz
router.post("/courses/:courseId/quizzes", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const courseId = parseInt(Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId, 10);
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!course || course.instructorId !== req.user.id) { res.status(403).json({ error: "Forbidden" }); return; }
  const { question, optionA, optionB, optionC, optionD, correctAnswer } = req.body;
  if (!question || !optionA || !optionB || !optionC || !optionD || !correctAnswer) { res.status(400).json({ error: "All fields required" }); return; }
  if (!["A", "B", "C", "D"].includes(correctAnswer)) { res.status(400).json({ error: "correctAnswer must be A, B, C, or D" }); return; }
  const [quiz] = await db.insert(quizzesTable).values({ courseId, question, optionA, optionB, optionC, optionD, correctAnswer }).returning();
  res.status(201).json(CreateQuizResponse.parse({ id: quiz.id, courseId: quiz.courseId, question: quiz.question, optionA: quiz.optionA, optionB: quiz.optionB, optionC: quiz.optionC, optionD: quiz.optionD, createdAt: quiz.createdAt }));
});

// Submit quiz
router.post("/courses/:courseId/quizzes/submit", async (req, res): Promise<void> => {
  const courseId = parseInt(Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId, 10);
  const { answers } = req.body;
  if (!Array.isArray(answers)) { res.status(400).json({ error: "answers array required" }); return; }
  const quizzes = await db.select().from(quizzesTable).where(eq(quizzesTable.courseId, courseId));
  const quizMap = new Map(quizzes.map(q => [q.id, q.correctAnswer]));
  let score = 0;
  for (const a of answers) { if (quizMap.get(a.quizId) === a.answer) score++; }
  const total = quizzes.length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  res.json(SubmitQuizResponse.parse({ score, total, percentage }));
});

// Delete quiz
router.delete("/quizzes/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, id));
  if (!quiz) { res.status(404).json({ error: "Quiz not found" }); return; }
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, quiz.courseId));
  if (!course || course.instructorId !== req.user.id) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(quizzesTable).where(eq(quizzesTable.id, id));
  res.sendStatus(204);
});

export default router;
