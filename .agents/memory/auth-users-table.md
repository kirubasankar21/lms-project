---
name: Auth schema owns usersTable
description: The Replit Auth template owns the usersTable definition; adding LMS user fields must go there, not in a separate schema file.
---

The Replit Auth template at `lib/db/src/schema/auth.ts` exports `usersTable` with `id` (varchar, = Replit user ID from `claims.sub`).

**Rule:** Never define another `usersTable` in `lib/db/src/schema/lms.ts` (or any other schema file). The `lib/db/src/schema/index.ts` barrel re-exports everything, and esbuild will throw `Ambiguous import "usersTable" has multiple matching exports` if two files export the same name.

**Why:** `lib/db/src/schema/index.ts` does `export * from "./auth"; export * from "./lms";`. Any duplicate export name becomes ambiguous to esbuild during the API server build.

**How to apply:** To add LMS-specific user fields (e.g. `role`), add columns directly to `auth.ts`'s `usersTable`. Reference `usersTable` from `auth.ts` in LMS schema files via explicit import (`import { usersTable } from "./auth"`).

**Key fact:** `req.user.id` (from the session) = Replit user ID = `usersTable.id` primary key. Use `eq(usersTable.id, req.user.id)` for user lookups, NOT `replitId`.
