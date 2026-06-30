import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { ListUsersResponse, GetUserResponse, UpdateMyRoleResponse, UpdateUserRoleResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    replitId: u.id,
    name: [u.firstName, u.lastName].filter(Boolean).join(" ") || "User",
    email: u.email ?? null,
    profileImageUrl: u.profileImageUrl ?? null,
    role: u.role,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

// List all users (admin only)
router.get("/users", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
  if (!me || me.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(ListUsersResponse.parse(users.map(formatUser)));
});

// Get current user (me)
router.get("/users/me", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(GetUserResponse.parse(formatUser(user)));
});

// Get user by id
router.get("/users/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(GetUserResponse.parse(formatUser(user)));
});

// Delete user (admin only)
router.delete("/users/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
  if (!me || me.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.sendStatus(204);
});

// Update my role
router.patch("/users/me/role", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { role } = req.body;
  if (!role || !["student", "instructor", "admin"].includes(role)) {
    res.status(400).json({ error: "Invalid role" }); return;
  }
  if (role === "admin") {
    const [me] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
    if (!me || me.role !== "admin") { res.status(403).json({ error: "Cannot self-assign admin role" }); return; }
  }
  const [user] = await db.update(usersTable).set({ role }).where(eq(usersTable.id, req.user.id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(UpdateMyRoleResponse.parse(formatUser(user)));
});

// Update user role (admin only)
router.patch("/users/:id/role", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
  if (!me || me.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { role } = req.body;
  if (!role || !["student", "instructor", "admin"].includes(role)) {
    res.status(400).json({ error: "Invalid role" }); return;
  }
  const [user] = await db.update(usersTable).set({ role }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(UpdateUserRoleResponse.parse(formatUser(user)));
});

export default router;
