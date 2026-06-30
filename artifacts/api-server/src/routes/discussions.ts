import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, discussionsTable, usersTable } from "@workspace/db";
import { ListDiscussionsResponse, CreateDiscussionResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// List discussions for a course (threaded)
router.get("/courses/:courseId/discussions", async (req, res): Promise<void> => {
  const courseId = parseInt(Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId, 10);
  const all = await db.select().from(discussionsTable).where(eq(discussionsTable.courseId, courseId)).orderBy(discussionsTable.createdAt);

  const userIds = [...new Set(all.map(d => d.userId))];
  const users = await Promise.all(userIds.map(id => db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1)));
  const userMap = new Map(users.flatMap(u => u.map(x => [x.id, x])));

  const enrich = (d: typeof all[0]) => ({
    ...d,
    userName: (() => { const u = userMap.get(d.userId); return u ? [u.firstName, u.lastName].filter(Boolean).join(" ") || "User" : null; })(),
    userAvatarUrl: userMap.get(d.userId)?.profileImageUrl ?? null,
    replies: [] as object[],
  });

  const topLevel = all.filter(d => d.parentId == null).map(enrich);
  const replies = all.filter(d => d.parentId != null);
  for (const reply of replies) {
    const parent = topLevel.find(t => t.id === reply.parentId);
    if (parent) parent.replies.push(enrich(reply));
  }

  res.json(ListDiscussionsResponse.parse(topLevel));
});

// Create discussion post
router.post("/courses/:courseId/discussions", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const courseId = parseInt(Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId, 10);
  const { message, parentId } = req.body;
  if (!message) { res.status(400).json({ error: "message required" }); return; }
  const [post] = await db.insert(discussionsTable).values({ courseId, userId: req.user.id, message, parentId: parentId ?? null }).returning();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);
  const userName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "User" : null;
  res.status(201).json(CreateDiscussionResponse.parse({ ...post, userName, userAvatarUrl: user?.profileImageUrl ?? null, replies: [] }));
});

// Delete discussion
router.delete("/discussions/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [post] = await db.select().from(discussionsTable).where(eq(discussionsTable.id, id));
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }
  if (post.userId !== req.user.id) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(discussionsTable).where(eq(discussionsTable.id, id));
  res.sendStatus(204);
});

export default router;
