import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean, serial } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const genderEnum = pgEnum("gender", ["M", "F", "Other"]);
export const suggestionTypeEnum = pgEnum("suggestionType", ["diagnosis", "treatment", "medication", "summary"]);
export const notificationTypeEnum = pgEnum("type", ["patient_added", "ai_suggestion_ready", "consultation_created", "exam_added"]);
export const consentTypeEnum = pgEnum("consentType", ["data_processing", "ai_analysis", "research", "data_sharing"]);
export const protocolStatusEnum = pgEnum("protocol_status", ["draft", "active", "completed", "suspended"]);
export const participantStatusEnum = pgEnum("participant_status", ["enrolled", "active", "completed", "withdrawn"]);
export const syncStatusEnum = pgEnum("syncStatus", ["pending", "synced", "failed"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctorId").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }),
  gender: genderEnum("gender"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  medicalHistory: text("medicalHistory"),
  currentMedications: text("currentMedications"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

export const consultations = pgTable("consultations", {
  id: serial("id").primaryKey(),
  patientId: integer("patientId").notNull().references(() => patients.id),
  doctorId: integer("doctorId").notNull().references(() => users.id),
  date: timestamp("date").defaultNow().notNull(),
  symptoms: text("symptoms"),
  physicalExamination: text("physicalExamination"),
  assessment: text("assessment"),
  plan: text("plan"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Consultation = typeof consultations.$inferSelect;
export type InsertConsultation = typeof consultations.$inferInsert;

export const examResults = pgTable("examResults", {
  id: serial("id").primaryKey(),
  consultationId: integer("consultationId").notNull().references(() => consultations.id),
  patientId: integer("patientId").notNull().references(() => patients.id),
  examType: varchar("examType", { length: 100 }).notNull(),
  examDate: varchar("examDate", { length: 10 }),
  results: text("results"),
  normalRange: text("normalRange"),
  interpretation: text("interpretation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExamResult = typeof examResults.$inferSelect;
export type InsertExamResult = typeof examResults.$inferInsert;

export const aiSuggestions = pgTable("aiSuggestions", {
  id: serial("id").primaryKey(),
  consultationId: integer("consultationId").notNull().references(() => consultations.id),
  patientId: integer("patientId").notNull().references(() => patients.id),
  suggestionType: suggestionTypeEnum("suggestionType").notNull(),
  content: text("content").notNull(),
  model: varchar("model", { length: 100 }),
  confidence: integer("confidence"),
  reviewed: integer("reviewed").default(0),
  reviewedBy: integer("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AISuggestion = typeof aiSuggestions.$inferSelect;
export type InsertAISuggestion = typeof aiSuggestions.$inferInsert;

export const auditLogs = pgTable("auditLogs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resourceType", { length: 100 }),
  resourceId: integer("resourceId"),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  type: notificationTypeEnum("type").notNull(),
  resourceType: varchar("resourceType", { length: 100 }),
  resourceId: integer("resourceId"),
  read: boolean("read").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const aiExplanations = pgTable("aiExplanations", {
  id: serial("id").primaryKey(),
  suggestionId: integer("suggestionId").notNull().references(() => aiSuggestions.id),
  reasoning: text("reasoning").notNull(),
  keyFactors: text("keyFactors"),
  evidenceLinks: text("evidenceLinks"),
  alternativeOptions: text("alternativeOptions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AIExplanation = typeof aiExplanations.$inferSelect;
export type InsertAIExplanation = typeof aiExplanations.$inferInsert;

export const suggestionFeedback = pgTable("suggestionFeedback", {
  id: serial("id").primaryKey(),
  suggestionId: integer("suggestionId").notNull().references(() => aiSuggestions.id),
  doctorId: integer("doctorId").notNull().references(() => users.id),
  approved: boolean("approved").notNull(),
  feedback: text("feedback"),
  clinicalRelevance: integer("clinicalRelevance"),
  accuracy: integer("accuracy"),
  usefulness: integer("usefulness"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SuggestionFeedback = typeof suggestionFeedback.$inferSelect;
export type InsertSuggestionFeedback = typeof suggestionFeedback.$inferInsert;

export const patientConsent = pgTable("patientConsent", {
  id: serial("id").primaryKey(),
  patientId: integer("patientId").notNull().references(() => patients.id),
  consentType: consentTypeEnum("consentType").notNull(),
  consentGiven: boolean("consentGiven").notNull(),
  consentDate: timestamp("consentDate").notNull(),
  expiryDate: timestamp("expiryDate"),
  documentUrl: varchar("documentUrl", { length: 500 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PatientConsent = typeof patientConsent.$inferSelect;
export type InsertPatientConsent = typeof patientConsent.$inferInsert;

export const dataRetentionPolicy = pgTable("dataRetentionPolicy", {
  id: serial("id").primaryKey(),
  patientId: integer("patientId").notNull().references(() => patients.id),
  retentionPeriodMonths: integer("retentionPeriodMonths").default(36),
  deletionScheduledDate: timestamp("deletionScheduledDate"),
  deletionCompletedDate: timestamp("deletionCompletedDate"),
  deletionReason: varchar("deletionReason", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DataRetentionPolicy = typeof dataRetentionPolicy.$inferSelect;
export type InsertDataRetentionPolicy = typeof dataRetentionPolicy.$inferInsert;

export const medicalImages = pgTable("medicalImages", {
  id: serial("id").primaryKey(),
  consultationId: integer("consultationId").notNull().references(() => consultations.id),
  patientId: integer("patientId").notNull().references(() => patients.id),
  imageType: varchar("imageType", { length: 100 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  imageKey: varchar("imageKey", { length: 255 }).notNull(),
  description: text("description"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  analyzedAt: timestamp("analyzedAt"),
  aiAnalysisResult: text("aiAnalysisResult"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MedicalImage = typeof medicalImages.$inferSelect;
export type InsertMedicalImage = typeof medicalImages.$inferInsert;

export const researchProtocol = pgTable("researchProtocol", {
  id: serial("id").primaryKey(),
  protocolName: varchar("protocolName", { length: 255 }).notNull(),
  description: text("description"),
  principalInvestigator: varchar("principalInvestigator", { length: 255 }).notNull(),
  institution: varchar("institution", { length: 255 }),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  status: protocolStatusEnum("status").default("draft"),
  ethicsApprovalNumber: varchar("ethicsApprovalNumber", { length: 100 }),
  ethicsApprovalDate: timestamp("ethicsApprovalDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ResearchProtocol = typeof researchProtocol.$inferSelect;
export type InsertResearchProtocol = typeof researchProtocol.$inferInsert;

export const researchParticipant = pgTable("researchParticipant", {
  id: serial("id").primaryKey(),
  protocolId: integer("protocolId").notNull().references(() => researchProtocol.id),
  patientId: integer("patientId").notNull().references(() => patients.id),
  enrollmentDate: timestamp("enrollmentDate").defaultNow().notNull(),
  withdrawalDate: timestamp("withdrawalDate"),
  consentDocumentUrl: varchar("consentDocumentUrl", { length: 500 }),
  consentGiven: boolean("consentGiven").default(false),
  status: participantStatusEnum("status").default("enrolled"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ResearchParticipant = typeof researchParticipant.$inferSelect;
export type InsertResearchParticipant = typeof researchParticipant.$inferInsert;

export const hl7FhirMapping = pgTable("hl7FhirMapping", {
  id: serial("id").primaryKey(),
  patientId: integer("patientId").notNull().references(() => patients.id),
  externalEhrId: varchar("externalEhrId", { length: 255 }).notNull(),
  ehrSystem: varchar("ehrSystem", { length: 100 }).notNull(),
  fhirResourceType: varchar("fhirResourceType", { length: 100 }),
  fhirData: text("fhirData"),
  lastSyncDate: timestamp("lastSyncDate"),
  syncStatus: syncStatusEnum("syncStatus").default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HL7FhirMapping = typeof hl7FhirMapping.$inferSelect;
export type InsertHL7FhirMapping = typeof hl7FhirMapping.$inferInsert;

export const medicalSpecialties = pgTable("medicalSpecialties", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  englishName: varchar("englishName", { length: 100 }).notNull(),
  description: text("description"),
  icd10Code: varchar("icd10Code", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MedicalSpecialty = typeof medicalSpecialties.$inferSelect;
export type InsertMedicalSpecialty = typeof medicalSpecialties.$inferInsert;

export const doctorSpecialties = pgTable("doctorSpecialties", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctorId").notNull().references(() => users.id),
  specialtyId: integer("specialtyId").notNull().references(() => medicalSpecialties.id),
  licenseNumber: varchar("licenseNumber", { length: 100 }),
  yearsOfExperience: integer("yearsOfExperience"),
  isPrimary: boolean("isPrimary").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DoctorSpecialty = typeof doctorSpecialties.$inferSelect;
export type InsertDoctorSpecialty = typeof doctorSpecialties.$inferInsert;

export const clinicalGuidelines = pgTable("clinicalGuidelines", {
  id: serial("id").primaryKey(),
  specialtyId: integer("specialtyId").notNull().references(() => medicalSpecialties.id),
  condition: varchar("condition", { length: 255 }).notNull(),
  guidelineContent: text("guidelineContent").notNull(),
  source: varchar("source", { length: 255 }),
  publicationYear: integer("publicationYear"),
  version: varchar("version", { length: 50 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type ClinicalGuideline = typeof clinicalGuidelines.$inferSelect;
export type InsertClinicalGuideline = typeof clinicalGuidelines.$inferInsert;

export const specialtyMedications = pgTable("specialtyMedications", {
  id: serial("id").primaryKey(),
  specialtyId: integer("specialtyId").notNull().references(() => medicalSpecialties.id),
  medicationName: varchar("medicationName", { length: 255 }).notNull(),
  activeIngredient: varchar("activeIngredient", { length: 255 }),
  dosageForm: varchar("dosageForm", { length: 100 }),
  recommendedDose: varchar("recommendedDose", { length: 255 }),
  indications: text("indications"),
  contraindications: text("contraindications"),
  sideEffects: text("sideEffects"),
  interactions: text("interactions"),
  atcCode: varchar("atcCode", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpecialtyMedication = typeof specialtyMedications.$inferSelect;
export type InsertSpecialtyMedication = typeof specialtyMedications.$inferInsert;

export const specialtyDiagnosticTests = pgTable("specialtyDiagnosticTests", {
  id: serial("id").primaryKey(),
  specialtyId: integer("specialtyId").notNull().references(() => medicalSpecialties.id),
  testName: varchar("testName", { length: 255 }).notNull(),
  testCode: varchar("testCode", { length: 100 }),
  description: text("description"),
  normalRange: varchar("normalRange", { length: 255 }),
  interpretationGuidelines: text("interpretationGuidelines"),
  commonIndications: text("commonIndications"),
  sampleType: varchar("sampleType", { length: 100 }),
  turnaroundTime: varchar("turnaroundTime", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpecialtyDiagnosticTest = typeof specialtyDiagnosticTests.$inferSelect;
export type InsertSpecialtyDiagnosticTest = typeof specialtyDiagnosticTests.$inferInsert;

export const specialtyProcedures = pgTable("specialtyProcedures", {
  id: serial("id").primaryKey(),
  specialtyId: integer("specialtyId").notNull().references(() => medicalSpecialties.id),
  procedureName: varchar("procedureName", { length: 255 }).notNull(),
  procedureCode: varchar("procedureCode", { length: 100 }),
  description: text("description"),
  indications: text("indications"),
  contraindications: text("contraindications"),
  complications: text("complications"),
  estimatedDuration: varchar("estimatedDuration", { length: 100 }),
  recoveryTime: varchar("recoveryTime", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpecialtyProcedure = typeof specialtyProcedures.$inferSelect;
export type InsertSpecialtyProcedure = typeof specialtyProcedures.$inferInsert;

export const consultationSpecialty = pgTable("consultationSpecialty", {
  id: serial("id").primaryKey(),
  consultationId: integer("consultationId").notNull().references(() => consultations.id),
  specialtyId: integer("specialtyId").notNull().references(() => medicalSpecialties.id),
  primaryDiagnosis: varchar("primaryDiagnosis", { length: 255 }),
  icdCode: varchar("icdCode", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConsultationSpecialty = typeof consultationSpecialty.$inferSelect;
export type InsertConsultationSpecialty = typeof consultationSpecialty.$inferInsert;
