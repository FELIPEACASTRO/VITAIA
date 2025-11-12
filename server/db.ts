import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser,
  users,
  patients,
  InsertPatient,
  consultations,
  InsertConsultation,
  examResults,
  InsertExamResult,
  aiSuggestions,
  InsertAISuggestion,
  auditLogs,
  InsertAuditLog,
  notifications,
  InsertNotification,
  aiExplanations,
  InsertAIExplanation,
  suggestionFeedback,
  InsertSuggestionFeedback,
  patientConsent,
  InsertPatientConsent,
  dataRetentionPolicy,
  InsertDataRetentionPolicy,
  medicalImages,
  InsertMedicalImage,
  researchProtocol,
  InsertResearchProtocol,
  researchParticipant,
  InsertResearchParticipant,
  hl7FhirMapping,
  InsertHL7FhirMapping,
  medicalSpecialties,
  InsertMedicalSpecialty,
  doctorSpecialties,
  InsertDoctorSpecialty,
  clinicalGuidelines,
  InsertClinicalGuideline,
  specialtyMedications,
  InsertSpecialtyMedication,
  specialtyDiagnosticTests,
  InsertSpecialtyDiagnosticTest,
  specialtyProcedures,
  InsertSpecialtyProcedure,
  consultationSpecialty,
  InsertConsultationSpecialty,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Additional user functions for authentication
export async function getUsersByEmail(email: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.email, email));
}

export async function createUser(data: InsertUser): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .insert(users)
    .values(data)
    .returning({ id: users.id });
  return result[0].id;
}

export async function updateUserLastSignIn(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, userId));
}

export async function updateUserPassword(
  userId: number,
  hashedPassword: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(users)
    .set({
      password: hashedPassword,
      lastPasswordChange: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function createAuditLog(data: InsertAuditLog): Promise<void> {
  const db = await getDb();
  if (!db) return; // Silently fail if DB not available
  try {
    await db.insert(auditLogs).values(data);
  } catch (error) {
    console.error("[Audit] Failed to log event:", error);
  }
}

// Patient queries
export async function createPatient(data: InsertPatient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(patients).values(data);
  return result;
}

export async function getPatientsByDoctor(doctorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(patients).where(eq(patients.doctorId, doctorId));
}

export async function getPatientById(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(patients)
    .where(eq(patients.id, patientId))
    .limit(1);
  return result[0];
}

export async function updatePatient(
  patientId: number,
  data: Partial<InsertPatient>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(patients).set(data).where(eq(patients.id, patientId));
}

// Consultation queries
export async function createConsultation(data: InsertConsultation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(consultations).values(data);
}

export async function getConsultationsByPatient(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(consultations)
    .where(eq(consultations.patientId, patientId));
}

export async function getConsultationById(consultationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(consultations)
    .where(eq(consultations.id, consultationId))
    .limit(1);
  return result[0];
}

// Exam Results queries
export async function createExamResult(data: InsertExamResult) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(examResults).values(data);
}

export async function getExamResultsByConsultation(consultationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(examResults)
    .where(eq(examResults.consultationId, consultationId));
}

// AI Suggestions queries
export async function createAISuggestion(data: InsertAISuggestion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(aiSuggestions).values(data);
}

export async function getAISuggestionsByConsultation(consultationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(aiSuggestions)
    .where(eq(aiSuggestions.consultationId, consultationId));
}

export async function reviewAISuggestion(
  suggestionId: number,
  reviewed: number,
  reviewedBy: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .update(aiSuggestions)
    .set({ reviewed, reviewedBy, reviewedAt: new Date() })
    .where(eq(aiSuggestions.id, suggestionId));
}

// Audit Log queries
export async function logAuditEvent(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) return; // Silently fail if DB not available
  try {
    await db.insert(auditLogs).values(data);
  } catch (error) {
    console.error("[Audit] Failed to log event:", error);
  }
}

// Notification queries
export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(notifications).values(data);
}

export async function getNotificationsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId));
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, notificationId));
}

// Statistics queries
export async function getPatientCountByDoctor(doctorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(patients)
    .where(eq(patients.doctorId, doctorId));
  return result.length;
}

export async function getConsultationCountByDoctor(doctorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(consultations)
    .where(eq(consultations.doctorId, doctorId));
  return result.length;
}

export async function getAISuggestionStats(doctorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(aiSuggestions)
    .innerJoin(
      consultations,
      eq(aiSuggestions.consultationId, consultations.id)
    )
    .where(eq(consultations.doctorId, doctorId));

  const stats = {
    total: result.length,
    approved: result.filter(r => r.aiSuggestions.reviewed === 1).length,
    rejected: result.filter(r => r.aiSuggestions.reviewed === -1).length,
    pending: result.filter(r => r.aiSuggestions.reviewed === 0).length,
  };
  return stats;
}

// AI Explanation queries
export async function createAIExplanation(data: InsertAIExplanation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(aiExplanations).values(data);
}

export async function getAIExplanationBySuggestion(suggestionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(aiExplanations)
    .where(eq(aiExplanations.suggestionId, suggestionId))
    .limit(1);
  return result[0];
}

// Suggestion Feedback queries
export async function createSuggestionFeedback(data: InsertSuggestionFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(suggestionFeedback).values(data);
}

export async function getSuggestionFeedback(suggestionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(suggestionFeedback)
    .where(eq(suggestionFeedback.suggestionId, suggestionId));
  return result;
}

// Patient Consent queries
export async function createPatientConsent(data: InsertPatientConsent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(patientConsent).values(data);
}

export async function getPatientConsent(
  patientId: number,
  consentType: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { and } = require("drizzle-orm");
  const result = await db
    .select()
    .from(patientConsent)
    .where(eq(patientConsent.patientId, patientId));
  return result.find(r => r.consentType === consentType);
}

export async function getAllPatientConsents(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(patientConsent)
    .where(eq(patientConsent.patientId, patientId));
}

// Data Retention Policy queries
export async function createDataRetentionPolicy(
  data: InsertDataRetentionPolicy
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(dataRetentionPolicy).values(data);
}

export async function getDataRetentionPolicy(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(dataRetentionPolicy)
    .where(eq(dataRetentionPolicy.patientId, patientId))
    .limit(1);
  return result[0];
}

export async function updateDataRetentionPolicy(
  patientId: number,
  data: Partial<InsertDataRetentionPolicy>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .update(dataRetentionPolicy)
    .set(data)
    .where(eq(dataRetentionPolicy.patientId, patientId));
}

// Medical Images queries
export async function createMedicalImage(data: InsertMedicalImage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(medicalImages).values(data);
}

export async function getMedicalImagesByConsultation(consultationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(medicalImages)
    .where(eq(medicalImages.consultationId, consultationId));
}

export async function getMedicalImageById(imageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(medicalImages)
    .where(eq(medicalImages.id, imageId))
    .limit(1);
  return result[0];
}

export async function updateMedicalImageAnalysis(
  imageId: number,
  analysisResult: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .update(medicalImages)
    .set({ aiAnalysisResult: analysisResult, analyzedAt: new Date() })
    .where(eq(medicalImages.id, imageId));
}

// Research Protocol queries
export async function createResearchProtocol(data: InsertResearchProtocol) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(researchProtocol).values(data);
}

export async function getResearchProtocolById(protocolId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(researchProtocol)
    .where(eq(researchProtocol.id, protocolId))
    .limit(1);
  return result[0];
}

export async function getAllResearchProtocols() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(researchProtocol);
}

export async function updateResearchProtocol(
  protocolId: number,
  data: Partial<InsertResearchProtocol>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .update(researchProtocol)
    .set(data)
    .where(eq(researchProtocol.id, protocolId));
}

// Research Participant queries
export async function enrollResearchParticipant(
  data: InsertResearchParticipant
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(researchParticipant).values(data);
}

export async function getResearchParticipantsByProtocol(protocolId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(researchParticipant)
    .where(eq(researchParticipant.protocolId, protocolId));
}

export async function getResearchParticipantByPatient(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(researchParticipant)
    .where(eq(researchParticipant.patientId, patientId));
}

export async function updateResearchParticipant(
  participantId: number,
  data: Partial<InsertResearchParticipant>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .update(researchParticipant)
    .set(data)
    .where(eq(researchParticipant.id, participantId));
}

// HL7/FHIR Integration queries
export async function createHL7FhirMapping(data: InsertHL7FhirMapping) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(hl7FhirMapping).values(data);
}

export async function getHL7FhirMappingByPatient(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(hl7FhirMapping)
    .where(eq(hl7FhirMapping.patientId, patientId));
}

export async function updateHL7FhirMapping(
  mappingId: number,
  data: Partial<InsertHL7FhirMapping>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .update(hl7FhirMapping)
    .set(data)
    .where(eq(hl7FhirMapping.id, mappingId));
}

// Medical Specialties queries
export async function createMedicalSpecialty(data: InsertMedicalSpecialty) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(medicalSpecialties).values(data);
}

export async function getAllMedicalSpecialties() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(medicalSpecialties);
}

export async function getMedicalSpecialtyById(specialtyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(medicalSpecialties)
    .where(eq(medicalSpecialties.id, specialtyId))
    .limit(1);
  return result[0];
}

// Doctor Specialties queries
export async function addDoctorSpecialty(data: InsertDoctorSpecialty) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(doctorSpecialties).values(data);
}

export async function getDoctorSpecialties(doctorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(doctorSpecialties)
    .where(eq(doctorSpecialties.doctorId, doctorId));
}

// Clinical Guidelines queries
export async function createClinicalGuideline(data: InsertClinicalGuideline) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(clinicalGuidelines).values(data);
}

export async function getGuidelinesBySpecialty(specialtyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(clinicalGuidelines)
    .where(eq(clinicalGuidelines.specialtyId, specialtyId));
}

export async function getGuidelineByCondition(
  specialtyId: number,
  condition: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(clinicalGuidelines)
    .where(
      eq(clinicalGuidelines.specialtyId, specialtyId) &&
        eq(clinicalGuidelines.condition, condition)
    )
    .limit(1);
  return result[0];
}

// Specialty Medications queries
export async function createSpecialtyMedication(
  data: InsertSpecialtyMedication
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(specialtyMedications).values(data);
}

export async function getMedicationsBySpecialty(specialtyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(specialtyMedications)
    .where(eq(specialtyMedications.specialtyId, specialtyId));
}

// Specialty Diagnostic Tests queries
export async function createSpecialtyDiagnosticTest(
  data: InsertSpecialtyDiagnosticTest
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(specialtyDiagnosticTests).values(data);
}

export async function getTestsBySpecialty(specialtyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(specialtyDiagnosticTests)
    .where(eq(specialtyDiagnosticTests.specialtyId, specialtyId));
}

// Specialty Procedures queries
export async function createSpecialtyProcedure(data: InsertSpecialtyProcedure) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(specialtyProcedures).values(data);
}

export async function getProceduresBySpecialty(specialtyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(specialtyProcedures)
    .where(eq(specialtyProcedures.specialtyId, specialtyId));
}

// Consultation Specialty queries
export async function createConsultationSpecialty(
  data: InsertConsultationSpecialty
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(consultationSpecialty).values(data);
}

export async function getConsultationSpecialty(consultationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(consultationSpecialty)
    .where(eq(consultationSpecialty.consultationId, consultationId))
    .limit(1);
  return result[0];
}
