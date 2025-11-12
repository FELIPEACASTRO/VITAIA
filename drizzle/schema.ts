import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const genderEnum = pgEnum("gender", ["M", "F", "Other"]);
export const suggestionTypeEnum = pgEnum("suggestionType", [
  "diagnosis",
  "treatment",
  "medication",
  "summary",
  "differential_diagnosis",
  "treatment_plan",
  "lab_analysis",
  "multi_provider_consensus",
]);
export const notificationTypeEnum = pgEnum("type", [
  "patient_added",
  "ai_suggestion_ready",
  "consultation_created",
  "exam_added",
]);
export const consentTypeEnum = pgEnum("consentType", [
  "data_processing",
  "ai_analysis",
  "research",
  "data_sharing",
]);
export const protocolStatusEnum = pgEnum("protocol_status", [
  "draft",
  "active",
  "completed",
  "suspended",
]);
export const participantStatusEnum = pgEnum("participant_status", [
  "enrolled",
  "active",
  "completed",
  "withdrawn",
]);
export const syncStatusEnum = pgEnum("syncStatus", [
  "pending",
  "synced",
  "failed",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  password: varchar("password", { length: 255 }), // Hash da senha
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  crm: varchar("crm", { length: 20 }), // Registro médico
  specialty: varchar("specialty", { length: 100 }), // Especialidade médica
  isActive: boolean("isActive").default(true), // Status da conta
  emailVerified: boolean("emailVerified").default(false), // Email verificado
  twoFactorEnabled: boolean("twoFactorEnabled").default(false), // 2FA
  twoFactorSecret: varchar("twoFactorSecret", { length: 32 }), // Secret para 2FA
  lastPasswordChange: timestamp("lastPasswordChange"), // Última mudança de senha
  failedLoginAttempts: integer("failedLoginAttempts").default(0), // Tentativas de login falhadas
  lockedUntil: timestamp("lockedUntil"), // Conta bloqueada até
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctorId")
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }),
  gender: genderEnum("gender"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  medicalHistory: text("medicalHistory"),
  currentMedications: text("currentMedications"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

export const consultations = pgTable("consultations", {
  id: serial("id").primaryKey(),
  patientId: integer("patientId")
    .notNull()
    .references(() => patients.id),
  doctorId: integer("doctorId")
    .notNull()
    .references(() => users.id),
  date: timestamp("date").defaultNow().notNull(),
  symptoms: text("symptoms"),
  physicalExamination: text("physicalExamination"),
  assessment: text("assessment"),
  plan: text("plan"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Consultation = typeof consultations.$inferSelect;
export type InsertConsultation = typeof consultations.$inferInsert;

export const examResults = pgTable("examResults", {
  id: serial("id").primaryKey(),
  consultationId: integer("consultationId")
    .notNull()
    .references(() => consultations.id),
  patientId: integer("patientId")
    .notNull()
    .references(() => patients.id),
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
  consultationId: integer("consultationId")
    .notNull()
    .references(() => consultations.id),
  patientId: integer("patientId")
    .notNull()
    .references(() => patients.id),
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
  userId: integer("userId")
    .notNull()
    .references(() => users.id),
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
  suggestionId: integer("suggestionId")
    .notNull()
    .references(() => aiSuggestions.id),
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
  suggestionId: integer("suggestionId")
    .notNull()
    .references(() => aiSuggestions.id),
  doctorId: integer("doctorId")
    .notNull()
    .references(() => users.id),
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
  patientId: integer("patientId")
    .notNull()
    .references(() => patients.id),
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
  patientId: integer("patientId")
    .notNull()
    .references(() => patients.id),
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
  consultationId: integer("consultationId")
    .notNull()
    .references(() => consultations.id),
  patientId: integer("patientId")
    .notNull()
    .references(() => patients.id),
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
  principalInvestigator: varchar("principalInvestigator", {
    length: 255,
  }).notNull(),
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
  protocolId: integer("protocolId")
    .notNull()
    .references(() => researchProtocol.id),
  patientId: integer("patientId")
    .notNull()
    .references(() => patients.id),
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
  patientId: integer("patientId")
    .notNull()
    .references(() => patients.id),
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
  doctorId: integer("doctorId")
    .notNull()
    .references(() => users.id),
  specialtyId: integer("specialtyId")
    .notNull()
    .references(() => medicalSpecialties.id),
  licenseNumber: varchar("licenseNumber", { length: 100 }),
  yearsOfExperience: integer("yearsOfExperience"),
  isPrimary: boolean("isPrimary").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DoctorSpecialty = typeof doctorSpecialties.$inferSelect;
export type InsertDoctorSpecialty = typeof doctorSpecialties.$inferInsert;

export const clinicalGuidelines = pgTable("clinicalGuidelines", {
  id: serial("id").primaryKey(),
  specialtyId: integer("specialtyId")
    .notNull()
    .references(() => medicalSpecialties.id),
  condition: varchar("condition", { length: 255 }).notNull(),
  guidelineContent: text("guidelineContent").notNull(),
  source: varchar("source", { length: 255 }),
  publicationYear: integer("publicationYear"),
  version: varchar("version", { length: 50 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ClinicalGuideline = typeof clinicalGuidelines.$inferSelect;
export type InsertClinicalGuideline = typeof clinicalGuidelines.$inferInsert;

export const specialtyMedications = pgTable("specialtyMedications", {
  id: serial("id").primaryKey(),
  specialtyId: integer("specialtyId")
    .notNull()
    .references(() => medicalSpecialties.id),
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
export type InsertSpecialtyMedication =
  typeof specialtyMedications.$inferInsert;

export const specialtyDiagnosticTests = pgTable("specialtyDiagnosticTests", {
  id: serial("id").primaryKey(),
  specialtyId: integer("specialtyId")
    .notNull()
    .references(() => medicalSpecialties.id),
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

export type SpecialtyDiagnosticTest =
  typeof specialtyDiagnosticTests.$inferSelect;
export type InsertSpecialtyDiagnosticTest =
  typeof specialtyDiagnosticTests.$inferInsert;

export const specialtyProcedures = pgTable("specialtyProcedures", {
  id: serial("id").primaryKey(),
  specialtyId: integer("specialtyId")
    .notNull()
    .references(() => medicalSpecialties.id),
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
  consultationId: integer("consultationId")
    .notNull()
    .references(() => consultations.id),
  specialtyId: integer("specialtyId")
    .notNull()
    .references(() => medicalSpecialties.id),
  primaryDiagnosis: varchar("primaryDiagnosis", { length: 255 }),
  icdCode: varchar("icdCode", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConsultationSpecialty = typeof consultationSpecialty.$inferSelect;
export type InsertConsultationSpecialty =
  typeof consultationSpecialty.$inferInsert;

// ========================================
// MLOPS E MACHINE LEARNING TABLES
// ========================================

export const modelStatusEnum = pgEnum("model_status", [
  "training",
  "active",
  "deprecated",
  "failed",
]);
export const experimentStatusEnum = pgEnum("experiment_status", [
  "running",
  "completed",
  "failed",
  "cancelled",
]);
export const featureTypeEnum = pgEnum("feature_type", [
  "numerical",
  "categorical",
  "text",
  "image",
  "time_series",
]);
export const predictionStatusEnum = pgEnum("prediction_status", [
  "pending",
  "completed",
  "failed",
  "reviewed",
]);

// Registro de versões de modelos
export const modelVersions = pgTable("modelVersions", {
  id: serial("id").primaryKey(),
  modelName: varchar("modelName", { length: 100 }).notNull(),
  version: varchar("version", { length: 20 }).notNull(),
  description: text("description"),
  algorithm: varchar("algorithm", { length: 100 }), // Random Forest, XGBoost, Neural Network, etc.
  hyperparameters: text("hyperparameters"), // JSON com hiperparâmetros
  trainingDataHash: varchar("trainingDataHash", { length: 64 }), // Hash dos dados de treino
  modelPath: varchar("modelPath", { length: 500 }), // Caminho do modelo salvo
  status: modelStatusEnum("status").default("training"),
  accuracy: integer("accuracy"), // Acurácia em %
  precision: integer("precision"), // Precisão em %
  recall: integer("recall"), // Recall em %
  f1Score: integer("f1Score"), // F1-Score em %
  aucRoc: integer("aucRoc"), // AUC-ROC em %
  trainingTime: integer("trainingTime"), // Tempo de treino em segundos
  modelSize: integer("modelSize"), // Tamanho do modelo em bytes
  createdBy: integer("createdBy")
    .notNull()
    .references(() => users.id),
  deployedAt: timestamp("deployedAt"),
  deprecatedAt: timestamp("deprecatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ModelVersion = typeof modelVersions.$inferSelect;
export type InsertModelVersion = typeof modelVersions.$inferInsert;

// Experimentos de ML
export const mlExperiments = pgTable("mlExperiments", {
  id: serial("id").primaryKey(),
  experimentName: varchar("experimentName", { length: 100 }).notNull(),
  description: text("description"),
  objective: varchar("objective", { length: 100 }), // classification, regression, clustering
  dataset: varchar("dataset", { length: 100 }),
  status: experimentStatusEnum("status").default("running"),
  config: text("config"), // JSON com configuração do experimento
  metrics: text("metrics"), // JSON com métricas do experimento
  results: text("results"), // JSON com resultados
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdBy: integer("createdBy")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MLExperiment = typeof mlExperiments.$inferSelect;
export type InsertMLExperiment = typeof mlExperiments.$inferInsert;

// Feature Store
export const featureDefinitions = pgTable("featureDefinitions", {
  id: serial("id").primaryKey(),
  featureName: varchar("featureName", { length: 100 }).notNull().unique(),
  description: text("description"),
  featureType: featureTypeEnum("featureType").notNull(),
  source: varchar("source", { length: 100 }), // Tabela/fonte de origem
  transformation: text("transformation"), // SQL ou código de transformação
  validationRules: text("validationRules"), // JSON com regras de validação
  isActive: boolean("isActive").default(true),
  version: integer("version").default(1),
  createdBy: integer("createdBy")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type FeatureDefinition = typeof featureDefinitions.$inferSelect;
export type InsertFeatureDefinition = typeof featureDefinitions.$inferInsert;

// Datasets de treino
export const trainingDatasets = pgTable("trainingDatasets", {
  id: serial("id").primaryKey(),
  datasetName: varchar("datasetName", { length: 100 }).notNull(),
  description: text("description"),
  dataPath: varchar("dataPath", { length: 500 }), // Caminho dos dados
  dataHash: varchar("dataHash", { length: 64 }).notNull(), // Hash para versionamento
  size: integer("size"), // Número de registros
  features: text("features"), // JSON com lista de features
  target: varchar("target", { length: 100 }), // Variável target
  splitRatio: varchar("splitRatio", { length: 20 }), // Ex: "70/20/10" (train/val/test)
  createdBy: integer("createdBy")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrainingDataset = typeof trainingDatasets.$inferSelect;
export type InsertTrainingDataset = typeof trainingDatasets.$inferInsert;

// Log de predições para monitoramento
export const predictionLogs = pgTable("predictionLogs", {
  id: serial("id").primaryKey(),
  modelVersionId: integer("modelVersionId")
    .notNull()
    .references(() => modelVersions.id),
  consultationId: integer("consultationId").references(() => consultations.id),
  patientId: integer("patientId").references(() => patients.id),
  inputFeatures: text("inputFeatures").notNull(), // JSON com features de entrada
  prediction: text("prediction").notNull(), // JSON com predição
  confidence: integer("confidence"), // Confiança da predição (0-100)
  actualOutcome: text("actualOutcome"), // Resultado real (para feedback)
  feedback: text("feedback"), // Feedback do médico
  status: predictionStatusEnum("status").default("pending"),
  processingTime: integer("processingTime"), // Tempo de processamento em ms
  reviewedBy: integer("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PredictionLog = typeof predictionLogs.$inferSelect;
export type InsertPredictionLog = typeof predictionLogs.$inferInsert;

// Monitoramento de drift de modelo
export const modelDriftMonitoring = pgTable("modelDriftMonitoring", {
  id: serial("id").primaryKey(),
  modelVersionId: integer("modelVersionId")
    .notNull()
    .references(() => modelVersions.id),
  metricName: varchar("metricName", { length: 100 }).notNull(), // accuracy, precision, etc.
  currentValue: integer("currentValue").notNull(), // Valor atual da métrica
  baselineValue: integer("baselineValue").notNull(), // Valor baseline
  driftScore: integer("driftScore"), // Score de drift (0-100)
  threshold: integer("threshold").default(10), // Threshold para alerta
  isAlert: boolean("isAlert").default(false), // Se está em alerta
  alertSentAt: timestamp("alertSentAt"),
  measurementPeriod: varchar("measurementPeriod", { length: 20 }), // daily, weekly, monthly
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ModelDriftMonitoring = typeof modelDriftMonitoring.$inferSelect;
export type InsertModelDriftMonitoring =
  typeof modelDriftMonitoring.$inferInsert;

// Detecção de anomalias
export const anomalyDetections = pgTable("anomalyDetections", {
  id: serial("id").primaryKey(),
  detectionType: varchar("detectionType", { length: 50 }).notNull(), // fraud, outlier, pattern
  resourceType: varchar("resourceType", { length: 50 }), // consultation, user, prediction
  resourceId: integer("resourceId"),
  anomalyScore: integer("anomalyScore").notNull(), // Score de anomalia (0-100)
  description: text("description"),
  features: text("features"), // JSON com features que causaram a anomalia
  severity: varchar("severity", { length: 20 }).default("medium"), // low, medium, high, critical
  status: varchar("status", { length: 20 }).default("open"), // open, investigating, resolved, false_positive
  investigatedBy: integer("investigatedBy").references(() => users.id),
  investigatedAt: timestamp("investigatedAt"),
  resolution: text("resolution"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnomalyDetection = typeof anomalyDetections.$inferSelect;
export type InsertAnomalyDetection = typeof anomalyDetections.$inferInsert;

// Métricas de performance do sistema
export const systemMetrics = pgTable("systemMetrics", {
  id: serial("id").primaryKey(),
  metricName: varchar("metricName", { length: 100 }).notNull(),
  metricValue: integer("metricValue").notNull(),
  unit: varchar("unit", { length: 20 }), // ms, %, count, bytes
  category: varchar("category", { length: 50 }), // performance, usage, error, business
  tags: text("tags"), // JSON com tags adicionais
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = typeof systemMetrics.$inferInsert;
