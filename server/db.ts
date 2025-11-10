import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, patients, InsertPatient, consultations, InsertConsultation, examResults, InsertExamResult, aiSuggestions, InsertAISuggestion, auditLogs, InsertAuditLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
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

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
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
  const result = await db.select().from(patients).where(eq(patients.id, patientId)).limit(1);
  return result[0];
}

export async function updatePatient(patientId: number, data: Partial<InsertPatient>) {
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
  return db.select().from(consultations).where(eq(consultations.patientId, patientId));
}

export async function getConsultationById(consultationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(consultations).where(eq(consultations.id, consultationId)).limit(1);
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
  return db.select().from(examResults).where(eq(examResults.consultationId, consultationId));
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
  return db.select().from(aiSuggestions).where(eq(aiSuggestions.consultationId, consultationId));
}

export async function reviewAISuggestion(suggestionId: number, reviewed: number, reviewedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(aiSuggestions)
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
