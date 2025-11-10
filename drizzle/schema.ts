import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Patients table - stores patient information
 */
export const patients = mysqlTable("patients", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctorId").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }), // YYYY-MM-DD
  gender: mysqlEnum("gender", ["M", "F", "Other"]),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  medicalHistory: text("medicalHistory"), // Previous conditions, allergies, etc
  currentMedications: text("currentMedications"), // Current medications
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

/**
 * Consultations table - stores consultation records
 */
export const consultations = mysqlTable("consultations", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull().references(() => patients.id),
  doctorId: int("doctorId").notNull().references(() => users.id),
  date: timestamp("date").defaultNow().notNull(),
  symptoms: text("symptoms"), // Chief complaints and symptoms
  physicalExamination: text("physicalExamination"), // Physical exam findings
  assessment: text("assessment"), // Doctor's assessment
  plan: text("plan"), // Treatment plan
  notes: text("notes"), // Additional notes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Consultation = typeof consultations.$inferSelect;
export type InsertConsultation = typeof consultations.$inferInsert;

/**
 * Exam Results table - stores medical exam results
 */
export const examResults = mysqlTable("examResults", {
  id: int("id").autoincrement().primaryKey(),
  consultationId: int("consultationId").notNull().references(() => consultations.id),
  patientId: int("patientId").notNull().references(() => patients.id),
  examType: varchar("examType", { length: 100 }).notNull(), // e.g., "Blood Test", "X-Ray"
  examDate: varchar("examDate", { length: 10 }), // YYYY-MM-DD
  results: text("results"), // Exam results/findings
  normalRange: text("normalRange"), // Normal reference values
  interpretation: text("interpretation"), // Doctor's interpretation
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExamResult = typeof examResults.$inferSelect;
export type InsertExamResult = typeof examResults.$inferInsert;

/**
 * AI Suggestions table - stores AI-generated recommendations
 */
export const aiSuggestions = mysqlTable("aiSuggestions", {
  id: int("id").autoincrement().primaryKey(),
  consultationId: int("consultationId").notNull().references(() => consultations.id),
  patientId: int("patientId").notNull().references(() => patients.id),
  suggestionType: mysqlEnum("suggestionType", ["diagnosis", "treatment", "medication", "summary"]).notNull(),
  content: text("content").notNull(), // The AI suggestion
  model: varchar("model", { length: 100 }), // Which model generated this (e.g., "gemini", "llama")
  confidence: int("confidence"), // Confidence score 0-100
  reviewed: int("reviewed").default(0), // 0 = not reviewed, 1 = reviewed and approved, -1 = reviewed and rejected
  reviewedBy: int("reviewedBy").references(() => users.id), // Doctor who reviewed
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AISuggestion = typeof aiSuggestions.$inferSelect;
export type InsertAISuggestion = typeof aiSuggestions.$inferInsert;

/**
 * Audit Log table - stores all operations for LGPD compliance
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(), // e.g., "view_patient", "create_consultation"
  resourceType: varchar("resourceType", { length: 100 }), // e.g., "patient", "consultation"
  resourceId: int("resourceId"),
  details: text("details"), // Additional details about the action
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;