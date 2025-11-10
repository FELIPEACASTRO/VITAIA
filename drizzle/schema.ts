import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

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

/**
 * Notifications table - stores real-time notifications for doctors
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  type: mysqlEnum("type", ["patient_added", "ai_suggestion_ready", "consultation_created", "exam_added"]).notNull(),
  resourceType: varchar("resourceType", { length: 100 }),
  resourceId: int("resourceId"),
  read: boolean("read").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * AI Explanation table - stores detailed reasoning for AI suggestions
 */
export const aiExplanations = mysqlTable("aiExplanations", {
  id: int("id").autoincrement().primaryKey(),
  suggestionId: int("suggestionId").notNull().references(() => aiSuggestions.id),
  reasoning: text("reasoning").notNull(), // Step-by-step reasoning
  keyFactors: text("keyFactors"), // JSON array of key factors considered
  evidenceLinks: text("evidenceLinks"), // JSON array of evidence/references
  alternativeOptions: text("alternativeOptions"), // JSON array of alternatives
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AIExplanation = typeof aiExplanations.$inferSelect;
export type InsertAIExplanation = typeof aiExplanations.$inferInsert;

/**
 * Suggestion Feedback table - stores doctor feedback on AI suggestions
 */
export const suggestionFeedback = mysqlTable("suggestionFeedback", {
  id: int("id").autoincrement().primaryKey(),
  suggestionId: int("suggestionId").notNull().references(() => aiSuggestions.id),
  doctorId: int("doctorId").notNull().references(() => users.id),
  approved: boolean("approved").notNull(), // true = approved, false = rejected
  feedback: text("feedback"), // Doctor's feedback/justification
  clinicalRelevance: int("clinicalRelevance"), // 1-5 scale
  accuracy: int("accuracy"), // 1-5 scale
  usefulness: int("usefulness"), // 1-5 scale
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SuggestionFeedback = typeof suggestionFeedback.$inferSelect;
export type InsertSuggestionFeedback = typeof suggestionFeedback.$inferInsert;

/**
 * Patient Consent table - stores patient consent for data processing
 */
export const patientConsent = mysqlTable("patientConsent", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull().references(() => patients.id),
  consentType: mysqlEnum("consentType", ["data_processing", "ai_analysis", "research", "data_sharing"]).notNull(),
  consentGiven: boolean("consentGiven").notNull(),
  consentDate: timestamp("consentDate").notNull(),
  expiryDate: timestamp("expiryDate"), // Optional expiry date
  documentUrl: varchar("documentUrl", { length: 500 }), // URL to consent document
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PatientConsent = typeof patientConsent.$inferSelect;
export type InsertPatientConsent = typeof patientConsent.$inferInsert;

/**
 * Data Retention Policy table - stores data retention and deletion records
 */
export const dataRetentionPolicy = mysqlTable("dataRetentionPolicy", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull().references(() => patients.id),
  retentionPeriodMonths: int("retentionPeriodMonths").default(36), // Default 3 years
  deletionScheduledDate: timestamp("deletionScheduledDate"),
  deletionCompletedDate: timestamp("deletionCompletedDate"),
  deletionReason: varchar("deletionReason", { length: 255 }), // e.g., "patient_request", "retention_expired"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DataRetentionPolicy = typeof dataRetentionPolicy.$inferSelect;
export type InsertDataRetentionPolicy = typeof dataRetentionPolicy.$inferInsert;

/**
 * Medical Images table - stores medical imaging data
 */
export const medicalImages = mysqlTable("medicalImages", {
  id: int("id").autoincrement().primaryKey(),
  consultationId: int("consultationId").notNull().references(() => consultations.id),
  patientId: int("patientId").notNull().references(() => patients.id),
  imageType: varchar("imageType", { length: 100 }).notNull(), // e.g., "X-Ray", "CT Scan", "MRI"
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(), // S3 URL
  imageKey: varchar("imageKey", { length: 255 }).notNull(), // S3 key for retrieval
  description: text("description"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  analyzedAt: timestamp("analyzedAt"),
  aiAnalysisResult: text("aiAnalysisResult"), // JSON with AI findings
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MedicalImage = typeof medicalImages.$inferSelect;
export type InsertMedicalImage = typeof medicalImages.$inferInsert;

/**
 * Research Protocol table - stores clinical trial/study information
 */
export const researchProtocol = mysqlTable("researchProtocol", {
  id: int("id").autoincrement().primaryKey(),
  protocolName: varchar("protocolName", { length: 255 }).notNull(),
  description: text("description"),
  principalInvestigator: varchar("principalInvestigator", { length: 255 }).notNull(),
  institution: varchar("institution", { length: 255 }),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  status: mysqlEnum("status", ["draft", "active", "completed", "suspended"]).default("draft"),
  ethicsApprovalNumber: varchar("ethicsApprovalNumber", { length: 100 }),
  ethicsApprovalDate: timestamp("ethicsApprovalDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ResearchProtocol = typeof researchProtocol.$inferSelect;
export type InsertResearchProtocol = typeof researchProtocol.$inferInsert;

/**
 * Research Participant table - tracks patients enrolled in studies
 */
export const researchParticipant = mysqlTable("researchParticipant", {
  id: int("id").autoincrement().primaryKey(),
  protocolId: int("protocolId").notNull().references(() => researchProtocol.id),
  patientId: int("patientId").notNull().references(() => patients.id),
  enrollmentDate: timestamp("enrollmentDate").defaultNow().notNull(),
  withdrawalDate: timestamp("withdrawalDate"),
  consentDocumentUrl: varchar("consentDocumentUrl", { length: 500 }),
  consentGiven: boolean("consentGiven").default(false),
  status: mysqlEnum("status", ["enrolled", "active", "completed", "withdrawn"]).default("enrolled"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ResearchParticipant = typeof researchParticipant.$inferSelect;
export type InsertResearchParticipant = typeof researchParticipant.$inferInsert;

/**
 * HL7/FHIR Integration table - stores external EHR data mappings
 */
export const hl7FhirMapping = mysqlTable("hl7FhirMapping", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull().references(() => patients.id),
  externalEhrId: varchar("externalEhrId", { length: 255 }).notNull(), // ID from external EHR
  ehrSystem: varchar("ehrSystem", { length: 100 }).notNull(), // e.g., "Epic", "Cerner", "OpenEMR"
  fhirResourceType: varchar("fhirResourceType", { length: 100 }), // e.g., "Patient", "Observation"
  fhirData: text("fhirData"), // JSON FHIR resource
  lastSyncDate: timestamp("lastSyncDate"),
  syncStatus: mysqlEnum("syncStatus", ["pending", "synced", "failed"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HL7FhirMapping = typeof hl7FhirMapping.$inferSelect;
export type InsertHL7FhirMapping = typeof hl7FhirMapping.$inferInsert;

/**
 * Medical Specialties table - stores medical specialties
 */
export const medicalSpecialties = mysqlTable("medicalSpecialties", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(), // e.g., "Cardiologia", "Oncologia"
  englishName: varchar("englishName", { length: 100 }).notNull(),
  description: text("description"),
  icd10Code: varchar("icd10Code", { length: 10 }), // ICD-10 code for specialty
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MedicalSpecialty = typeof medicalSpecialties.$inferSelect;
export type InsertMedicalSpecialty = typeof medicalSpecialties.$inferInsert;

/**
 * Doctor Specialties junction table - links doctors to their specialties
 */
export const doctorSpecialties = mysqlTable("doctorSpecialties", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctorId").notNull().references(() => users.id),
  specialtyId: int("specialtyId").notNull().references(() => medicalSpecialties.id),
  licenseNumber: varchar("licenseNumber", { length: 100 }), // CRM number
  yearsOfExperience: int("yearsOfExperience"),
  isPrimary: boolean("isPrimary").default(false), // Primary specialty
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DoctorSpecialty = typeof doctorSpecialties.$inferSelect;
export type InsertDoctorSpecialty = typeof doctorSpecialties.$inferInsert;

/**
 * Clinical Guidelines table - stores evidence-based guidelines for each specialty
 */
export const clinicalGuidelines = mysqlTable("clinicalGuidelines", {
  id: int("id").autoincrement().primaryKey(),
  specialtyId: int("specialtyId").notNull().references(() => medicalSpecialties.id),
  condition: varchar("condition", { length: 255 }).notNull(), // e.g., "Hipertensão Arterial"
  guidelineContent: text("guidelineContent").notNull(), // Full guideline text
  source: varchar("source", { length: 255 }), // e.g., "SBC", "SBPT", "ASCO"
  publicationYear: int("publicationYear"),
  version: varchar("version", { length: 50 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClinicalGuideline = typeof clinicalGuidelines.$inferSelect;
export type InsertClinicalGuideline = typeof clinicalGuidelines.$inferInsert;

/**
 * Specialty-specific Medications table - stores medications relevant to each specialty
 */
export const specialtyMedications = mysqlTable("specialtyMedications", {
  id: int("id").autoincrement().primaryKey(),
  specialtyId: int("specialtyId").notNull().references(() => medicalSpecialties.id),
  medicationName: varchar("medicationName", { length: 255 }).notNull(),
  activeIngredient: varchar("activeIngredient", { length: 255 }),
  dosageForm: varchar("dosageForm", { length: 100 }), // e.g., "tablet", "injection"
  recommendedDose: varchar("recommendedDose", { length: 255 }),
  indications: text("indications"),
  contraindications: text("contraindications"),
  sideEffects: text("sideEffects"),
  interactions: text("interactions"),
  atcCode: varchar("atcCode", { length: 10 }), // ATC classification
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpecialtyMedication = typeof specialtyMedications.$inferSelect;
export type InsertSpecialtyMedication = typeof specialtyMedications.$inferInsert;

/**
 * Specialty-specific Diagnostic Tests table - stores tests relevant to each specialty
 */
export const specialtyDiagnosticTests = mysqlTable("specialtyDiagnosticTests", {
  id: int("id").autoincrement().primaryKey(),
  specialtyId: int("specialtyId").notNull().references(() => medicalSpecialties.id),
  testName: varchar("testName", { length: 255 }).notNull(),
  testCode: varchar("testCode", { length: 100 }),
  description: text("description"),
  normalRange: varchar("normalRange", { length: 255 }),
  interpretationGuidelines: text("interpretationGuidelines"),
  commonIndications: text("commonIndications"),
  sampleType: varchar("sampleType", { length: 100 }), // e.g., "blood", "urine"
  turnaroundTime: varchar("turnaroundTime", { length: 100 }), // e.g., "24 hours"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpecialtyDiagnosticTest = typeof specialtyDiagnosticTests.$inferSelect;
export type InsertSpecialtyDiagnosticTest = typeof specialtyDiagnosticTests.$inferInsert;

/**
 * Specialty-specific Procedures table - stores procedures relevant to each specialty
 */
export const specialtyProcedures = mysqlTable("specialtyProcedures", {
  id: int("id").autoincrement().primaryKey(),
  specialtyId: int("specialtyId").notNull().references(() => medicalSpecialties.id),
  procedureName: varchar("procedureName", { length: 255 }).notNull(),
  procedureCode: varchar("procedureCode", { length: 100 }), // CPT or TUSS code
  description: text("description"),
  indications: text("indications"),
  contraindications: text("contraindications"),
  complications: text("complications"),
  estimatedDuration: varchar("estimatedDuration", { length: 100 }), // e.g., "30-45 minutes"
  recoveryTime: varchar("recoveryTime", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpecialtyProcedure = typeof specialtyProcedures.$inferSelect;
export type InsertSpecialtyProcedure = typeof specialtyProcedures.$inferInsert;

/**
 * Consultation Specialty table - links consultations to specific specialties
 */
export const consultationSpecialty = mysqlTable("consultationSpecialty", {
  id: int("id").autoincrement().primaryKey(),
  consultationId: int("consultationId").notNull().references(() => consultations.id),
  specialtyId: int("specialtyId").notNull().references(() => medicalSpecialties.id),
  primaryDiagnosis: varchar("primaryDiagnosis", { length: 255 }),
  icdCode: varchar("icdCode", { length: 20 }), // ICD-10 code
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConsultationSpecialty = typeof consultationSpecialty.$inferSelect;
export type InsertConsultationSpecialty = typeof consultationSpecialty.$inferInsert;
