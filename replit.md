# LearnFlow LMS

A full-stack Learning Management System where students learn structured courses, instructors create content, and admins manage the platform.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — cookie session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 with Replit Auth (OIDC + PKCE)
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite + TailwindCSS v4
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/auth.ts` — Replit Auth tables (sessions, users with role field)
- `lib/db/src/schema/lms.ts` — LMS tables (courses, lessons, enrollments, progress, quizzes, assignments, submissions, discussions)
- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/lms/src/` — React frontend (pages/, components/)

## Architecture decisions

- Auth: Replit Auth (OIDC/PKCE). `req.user.id` = Replit user ID = primary key in `usersTable`. No custom JWT.
- Users table lives in `auth.ts` schema (Replit Auth owns it). Added `role` column there instead of a separate LMS users table.
- All LMS tables reference `usersTable.id` (varchar, Replit user ID) for foreign keys.
- API contract defined first in OpenAPI YAML, then codegen generates React Query hooks and Zod schemas. Server uses Zod schemas to validate responses.
- Frontend uses `@workspace/replit-auth-web` for `useAuth()` hook.

## Product

- **Students**: browse courses, enroll, watch lessons (YouTube embed), track progress, take quizzes, submit assignments, join discussions
- **Instructors**: create courses, add lessons, create quizzes/assignments, see submissions
- **Admins**: manage users (change roles, delete), manage all courses

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `lib/db/src/schema/auth.ts` owns `usersTable` — do NOT re-export it from `lms.ts` (causes ambiguous import build error)
- After any schema changes: run `pnpm --filter @workspace/db run push`
- After any OpenAPI spec changes: run `pnpm --filter @workspace/api-spec run codegen`
- `useListCourses({ instructorId: "..." })` — query params go directly as first arg, not nested
- `req.user.id` is the Replit user ID (stored as `usersTable.id`)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
