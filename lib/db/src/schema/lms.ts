import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  numeric,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

// ── Courses ──────────────────────────────────────────────────────────────────

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  instructorId: varchar("instructor_id").notNull().references(() => usersTable.id),
  price: numeric("price", { precision: 10, scale: 2 }),
  isFree: boolean("is_free").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertCourseSchema = createInsertSchema(coursesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof coursesTable.$inferSelect;

// ── Lessons ──────────────────────────────────────────────────────────────────

export const lessonsTable = pgTable("lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id")
    .notNull()
    .references(() => coursesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  videoUrl: text("video_url").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertLessonSchema = createInsertSchema(lessonsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessonsTable.$inferSelect;

// ── Enrollments ───────────────────────────────────────────────────────────────

export const enrollmentsTable = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => usersTable.id),
  courseId: integer("course_id")
    .notNull()
    .references(() => coursesTable.id, { onDelete: "cascade" }),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertEnrollmentSchema = createInsertSchema(enrollmentsTable).omit(
  { id: true, enrolledAt: true }
);
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollmentsTable.$inferSelect;

// ── Lesson Progress ───────────────────────────────────────────────────────────

export const lessonProgressTable = pgTable("lesson_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => usersTable.id),
  lessonId: integer("lesson_id")
    .notNull()
    .references(() => lessonsTable.id, { onDelete: "cascade" }),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertLessonProgressSchema = createInsertSchema(
  lessonProgressTable
).omit({ id: true });
export type InsertLessonProgress = z.infer<typeof insertLessonProgressSchema>;
export type LessonProgress = typeof lessonProgressTable.$inferSelect;

// ── Quizzes ──────────────────────────────────────────────────────────────────

export const quizzesTable = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id")
    .notNull()
    .references(() => coursesTable.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctAnswer: text("correct_answer").notNull(), // A | B | C | D
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertQuizSchema = createInsertSchema(quizzesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzesTable.$inferSelect;

// ── Assignments ───────────────────────────────────────────────────────────────

export const assignmentsTable = pgTable("assignments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id")
    .notNull()
    .references(() => coursesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: text("due_date"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertAssignmentSchema = createInsertSchema(assignmentsTable).omit(
  { id: true, createdAt: true }
);
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignmentsTable.$inferSelect;

// ── Submissions ───────────────────────────────────────────────────────────────

export const submissionsTable = pgTable("submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id")
    .notNull()
    .references(() => assignmentsTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => usersTable.id),
  answer: text("answer").notNull(),
  fileUrl: text("file_url"),
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertSubmissionSchema = createInsertSchema(submissionsTable).omit(
  { id: true, submittedAt: true }
);
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissionsTable.$inferSelect;

// ── Discussions ───────────────────────────────────────────────────────────────

export const discussionsTable = pgTable("discussions", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id")
    .notNull()
    .references(() => coursesTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => usersTable.id),
  message: text("message").notNull(),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertDiscussionSchema = createInsertSchema(discussionsTable).omit(
  { id: true, createdAt: true }
);
export type InsertDiscussion = z.infer<typeof insertDiscussionSchema>;
export type Discussion = typeof discussionsTable.$inferSelect;
