import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, usersTable, coursesTable, enrollmentsTable, lessonsTable, lessonProgressTable, discussionsTable, submissionsTable } from "@workspace/db";
import { GetDashboardSummaryResponse, GetRecentActivityResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [userRecord] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
  if (!userRecord) { res.status(404).json({ error: "User not found" }); return; }

  const role = userRecord.role;
  const [{ totalCourses }] = await db.select({ totalCourses: sql<number>`count(*)::int` }).from(coursesTable);
  const [{ totalEnrollments }] = await db.select({ totalEnrollments: sql<number>`count(*)::int` }).from(enrollmentsTable);

  if (role === "admin") {
    const [{ totalUsers }] = await db.select({ totalUsers: sql<number>`count(*)::int` }).from(usersTable);
    const [{ totalStudents }] = await db.select({ totalStudents: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "student"));
    const [{ totalInstructors }] = await db.select({ totalInstructors: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "instructor"));
    res.json(GetDashboardSummaryResponse.parse({ role, totalCourses, totalEnrollments, totalUsers, totalStudents, totalInstructors, myCoursesCount: 0, enrolledCoursesCount: 0, completedCoursesCount: 0, averageProgress: 0 }));
    return;
  }

  if (role === "instructor") {
    const [{ myCoursesCount }] = await db.select({ myCoursesCount: sql<number>`count(*)::int` }).from(coursesTable).where(eq(coursesTable.instructorId, req.user.id));
    res.json(GetDashboardSummaryResponse.parse({ role, totalCourses, totalEnrollments, totalUsers: 0, totalStudents: 0, totalInstructors: 0, myCoursesCount, enrolledCoursesCount: 0, completedCoursesCount: 0, averageProgress: 0 }));
    return;
  }

  // Student
  const myEnrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.userId, req.user.id));
  const enrolledCoursesCount = myEnrollments.length;
  let completedCoursesCount = 0;
  let totalProgress = 0;

  for (const e of myEnrollments) {
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(lessonsTable).where(eq(lessonsTable.courseId, e.courseId));
    if (total === 0) continue;
    const [{ done }] = await db.select({ done: sql<number>`count(*)::int` })
      .from(lessonProgressTable)
      .innerJoin(lessonsTable, eq(lessonProgressTable.lessonId, lessonsTable.id))
      .where(and(eq(lessonsTable.courseId, e.courseId), eq(lessonProgressTable.userId, req.user.id), eq(lessonProgressTable.completed, true)));
    const pct = Math.round((done / total) * 100);
    totalProgress += pct;
    if (pct === 100) completedCoursesCount++;
  }

  res.json(GetDashboardSummaryResponse.parse({ role, totalCourses, totalEnrollments, totalUsers: 0, totalStudents: 0, totalInstructors: 0, myCoursesCount: 0, enrolledCoursesCount, completedCoursesCount, averageProgress: enrolledCoursesCount > 0 ? Math.round(totalProgress / enrolledCoursesCount) : 0 }));
});

router.get("/dashboard/recent-activity", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }

  const items: { id: string; type: string; message: string; courseTitle: string | null; createdAt: Date }[] = [];

  const recentEnrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.userId, req.user.id)).orderBy(enrollmentsTable.enrolledAt).limit(5);
  for (const e of recentEnrollments) {
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, e.courseId));
    items.push({ id: `enroll-${e.id}`, type: "enrollment", message: `You enrolled in "${course?.title ?? "a course"}"`, courseTitle: course?.title ?? null, createdAt: e.enrolledAt });
  }

  const recentSubs = await db.select().from(submissionsTable).where(eq(submissionsTable.userId, req.user.id)).orderBy(submissionsTable.submittedAt).limit(3);
  for (const s of recentSubs) {
    items.push({ id: `sub-${s.id}`, type: "submission", message: "You submitted an assignment", courseTitle: null, createdAt: s.submittedAt });
  }

  const recentDisc = await db.select().from(discussionsTable).where(eq(discussionsTable.userId, req.user.id)).orderBy(discussionsTable.createdAt).limit(3);
  for (const d of recentDisc) {
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, d.courseId));
    items.push({ id: `disc-${d.id}`, type: "discussion", message: "You posted in a discussion", courseTitle: course?.title ?? null, createdAt: d.createdAt });
  }

  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  res.json(GetRecentActivityResponse.parse(items.slice(0, 10)));
});

export default router;
