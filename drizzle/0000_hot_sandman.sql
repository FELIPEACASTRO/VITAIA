CREATE TYPE "public"."consentType" AS ENUM('data_processing', 'ai_analysis', 'research', 'data_sharing');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('M', 'F', 'Other');--> statement-breakpoint
CREATE TYPE "public"."type" AS ENUM('patient_added', 'ai_suggestion_ready', 'consultation_created', 'exam_added');--> statement-breakpoint
CREATE TYPE "public"."participant_status" AS ENUM('enrolled', 'active', 'completed', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."protocol_status" AS ENUM('draft', 'active', 'completed', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."suggestionType" AS ENUM('diagnosis', 'treatment', 'medication', 'summary');--> statement-breakpoint
CREATE TYPE "public"."syncStatus" AS ENUM('pending', 'synced', 'failed');--> statement-breakpoint
CREATE TABLE "aiExplanations" (
	"id" serial PRIMARY KEY NOT NULL,
	"suggestionId" integer NOT NULL,
	"reasoning" text NOT NULL,
	"keyFactors" text,
	"evidenceLinks" text,
	"alternativeOptions" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aiSuggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"consultationId" integer NOT NULL,
	"patientId" integer NOT NULL,
	"suggestionType" "suggestionType" NOT NULL,
	"content" text NOT NULL,
	"model" varchar(100),
	"confidence" integer,
	"reviewed" integer DEFAULT 0,
	"reviewedBy" integer,
	"reviewedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auditLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"action" varchar(100) NOT NULL,
	"resourceType" varchar(100),
	"resourceId" integer,
	"details" text,
	"ipAddress" varchar(45),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinicalGuidelines" (
	"id" serial PRIMARY KEY NOT NULL,
	"specialtyId" integer NOT NULL,
	"condition" varchar(255) NOT NULL,
	"guidelineContent" text NOT NULL,
	"source" varchar(255),
	"publicationYear" integer,
	"version" varchar(50),
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultationSpecialty" (
	"id" serial PRIMARY KEY NOT NULL,
	"consultationId" integer NOT NULL,
	"specialtyId" integer NOT NULL,
	"primaryDiagnosis" varchar(255),
	"icdCode" varchar(20),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" serial PRIMARY KEY NOT NULL,
	"patientId" integer NOT NULL,
	"doctorId" integer NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"symptoms" text,
	"physicalExamination" text,
	"assessment" text,
	"plan" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dataRetentionPolicy" (
	"id" serial PRIMARY KEY NOT NULL,
	"patientId" integer NOT NULL,
	"retentionPeriodMonths" integer DEFAULT 36,
	"deletionScheduledDate" timestamp,
	"deletionCompletedDate" timestamp,
	"deletionReason" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctorSpecialties" (
	"id" serial PRIMARY KEY NOT NULL,
	"doctorId" integer NOT NULL,
	"specialtyId" integer NOT NULL,
	"licenseNumber" varchar(100),
	"yearsOfExperience" integer,
	"isPrimary" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "examResults" (
	"id" serial PRIMARY KEY NOT NULL,
	"consultationId" integer NOT NULL,
	"patientId" integer NOT NULL,
	"examType" varchar(100) NOT NULL,
	"examDate" varchar(10),
	"results" text,
	"normalRange" text,
	"interpretation" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hl7FhirMapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"patientId" integer NOT NULL,
	"externalEhrId" varchar(255) NOT NULL,
	"ehrSystem" varchar(100) NOT NULL,
	"fhirResourceType" varchar(100),
	"fhirData" text,
	"lastSyncDate" timestamp,
	"syncStatus" "syncStatus" DEFAULT 'pending',
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medicalImages" (
	"id" serial PRIMARY KEY NOT NULL,
	"consultationId" integer NOT NULL,
	"patientId" integer NOT NULL,
	"imageType" varchar(100) NOT NULL,
	"imageUrl" varchar(500) NOT NULL,
	"imageKey" varchar(255) NOT NULL,
	"description" text,
	"uploadedAt" timestamp DEFAULT now() NOT NULL,
	"analyzedAt" timestamp,
	"aiAnalysisResult" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medicalSpecialties" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"englishName" varchar(100) NOT NULL,
	"description" text,
	"icd10Code" varchar(10),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "medicalSpecialties_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"type" "type" NOT NULL,
	"resourceType" varchar(100),
	"resourceId" integer,
	"read" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patientConsent" (
	"id" serial PRIMARY KEY NOT NULL,
	"patientId" integer NOT NULL,
	"consentType" "consentType" NOT NULL,
	"consentGiven" boolean NOT NULL,
	"consentDate" timestamp NOT NULL,
	"expiryDate" timestamp,
	"documentUrl" varchar(500),
	"ipAddress" varchar(45),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" serial PRIMARY KEY NOT NULL,
	"doctorId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"dateOfBirth" varchar(10),
	"gender" "gender",
	"email" varchar(320),
	"phone" varchar(20),
	"medicalHistory" text,
	"currentMedications" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "researchParticipant" (
	"id" serial PRIMARY KEY NOT NULL,
	"protocolId" integer NOT NULL,
	"patientId" integer NOT NULL,
	"enrollmentDate" timestamp DEFAULT now() NOT NULL,
	"withdrawalDate" timestamp,
	"consentDocumentUrl" varchar(500),
	"consentGiven" boolean DEFAULT false,
	"status" "participant_status" DEFAULT 'enrolled',
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "researchProtocol" (
	"id" serial PRIMARY KEY NOT NULL,
	"protocolName" varchar(255) NOT NULL,
	"description" text,
	"principalInvestigator" varchar(255) NOT NULL,
	"institution" varchar(255),
	"startDate" timestamp NOT NULL,
	"endDate" timestamp,
	"status" "protocol_status" DEFAULT 'draft',
	"ethicsApprovalNumber" varchar(100),
	"ethicsApprovalDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specialtyDiagnosticTests" (
	"id" serial PRIMARY KEY NOT NULL,
	"specialtyId" integer NOT NULL,
	"testName" varchar(255) NOT NULL,
	"testCode" varchar(100),
	"description" text,
	"normalRange" varchar(255),
	"interpretationGuidelines" text,
	"commonIndications" text,
	"sampleType" varchar(100),
	"turnaroundTime" varchar(100),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specialtyMedications" (
	"id" serial PRIMARY KEY NOT NULL,
	"specialtyId" integer NOT NULL,
	"medicationName" varchar(255) NOT NULL,
	"activeIngredient" varchar(255),
	"dosageForm" varchar(100),
	"recommendedDose" varchar(255),
	"indications" text,
	"contraindications" text,
	"sideEffects" text,
	"interactions" text,
	"atcCode" varchar(10),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specialtyProcedures" (
	"id" serial PRIMARY KEY NOT NULL,
	"specialtyId" integer NOT NULL,
	"procedureName" varchar(255) NOT NULL,
	"procedureCode" varchar(100),
	"description" text,
	"indications" text,
	"contraindications" text,
	"complications" text,
	"estimatedDuration" varchar(100),
	"recoveryTime" varchar(100),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suggestionFeedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"suggestionId" integer NOT NULL,
	"doctorId" integer NOT NULL,
	"approved" boolean NOT NULL,
	"feedback" text,
	"clinicalRelevance" integer,
	"accuracy" integer,
	"usefulness" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
ALTER TABLE "aiExplanations" ADD CONSTRAINT "aiExplanations_suggestionId_aiSuggestions_id_fk" FOREIGN KEY ("suggestionId") REFERENCES "public"."aiSuggestions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aiSuggestions" ADD CONSTRAINT "aiSuggestions_consultationId_consultations_id_fk" FOREIGN KEY ("consultationId") REFERENCES "public"."consultations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aiSuggestions" ADD CONSTRAINT "aiSuggestions_patientId_patients_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aiSuggestions" ADD CONSTRAINT "aiSuggestions_reviewedBy_users_id_fk" FOREIGN KEY ("reviewedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditLogs" ADD CONSTRAINT "auditLogs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinicalGuidelines" ADD CONSTRAINT "clinicalGuidelines_specialtyId_medicalSpecialties_id_fk" FOREIGN KEY ("specialtyId") REFERENCES "public"."medicalSpecialties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultationSpecialty" ADD CONSTRAINT "consultationSpecialty_consultationId_consultations_id_fk" FOREIGN KEY ("consultationId") REFERENCES "public"."consultations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultationSpecialty" ADD CONSTRAINT "consultationSpecialty_specialtyId_medicalSpecialties_id_fk" FOREIGN KEY ("specialtyId") REFERENCES "public"."medicalSpecialties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patientId_patients_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_doctorId_users_id_fk" FOREIGN KEY ("doctorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataRetentionPolicy" ADD CONSTRAINT "dataRetentionPolicy_patientId_patients_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctorSpecialties" ADD CONSTRAINT "doctorSpecialties_doctorId_users_id_fk" FOREIGN KEY ("doctorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctorSpecialties" ADD CONSTRAINT "doctorSpecialties_specialtyId_medicalSpecialties_id_fk" FOREIGN KEY ("specialtyId") REFERENCES "public"."medicalSpecialties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "examResults" ADD CONSTRAINT "examResults_consultationId_consultations_id_fk" FOREIGN KEY ("consultationId") REFERENCES "public"."consultations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "examResults" ADD CONSTRAINT "examResults_patientId_patients_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hl7FhirMapping" ADD CONSTRAINT "hl7FhirMapping_patientId_patients_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicalImages" ADD CONSTRAINT "medicalImages_consultationId_consultations_id_fk" FOREIGN KEY ("consultationId") REFERENCES "public"."consultations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicalImages" ADD CONSTRAINT "medicalImages_patientId_patients_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patientConsent" ADD CONSTRAINT "patientConsent_patientId_patients_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_doctorId_users_id_fk" FOREIGN KEY ("doctorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "researchParticipant" ADD CONSTRAINT "researchParticipant_protocolId_researchProtocol_id_fk" FOREIGN KEY ("protocolId") REFERENCES "public"."researchProtocol"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "researchParticipant" ADD CONSTRAINT "researchParticipant_patientId_patients_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialtyDiagnosticTests" ADD CONSTRAINT "specialtyDiagnosticTests_specialtyId_medicalSpecialties_id_fk" FOREIGN KEY ("specialtyId") REFERENCES "public"."medicalSpecialties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialtyMedications" ADD CONSTRAINT "specialtyMedications_specialtyId_medicalSpecialties_id_fk" FOREIGN KEY ("specialtyId") REFERENCES "public"."medicalSpecialties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialtyProcedures" ADD CONSTRAINT "specialtyProcedures_specialtyId_medicalSpecialties_id_fk" FOREIGN KEY ("specialtyId") REFERENCES "public"."medicalSpecialties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggestionFeedback" ADD CONSTRAINT "suggestionFeedback_suggestionId_aiSuggestions_id_fk" FOREIGN KEY ("suggestionId") REFERENCES "public"."aiSuggestions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggestionFeedback" ADD CONSTRAINT "suggestionFeedback_doctorId_users_id_fk" FOREIGN KEY ("doctorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;