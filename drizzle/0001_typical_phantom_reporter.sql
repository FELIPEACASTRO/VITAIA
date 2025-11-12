CREATE TYPE "public"."experiment_status" AS ENUM('running', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."feature_type" AS ENUM('numerical', 'categorical', 'text', 'image', 'time_series');--> statement-breakpoint
CREATE TYPE "public"."model_status" AS ENUM('training', 'active', 'deprecated', 'failed');--> statement-breakpoint
CREATE TYPE "public"."prediction_status" AS ENUM('pending', 'completed', 'failed', 'reviewed');--> statement-breakpoint
ALTER TYPE "public"."suggestionType" ADD VALUE 'differential_diagnosis';--> statement-breakpoint
ALTER TYPE "public"."suggestionType" ADD VALUE 'treatment_plan';--> statement-breakpoint
ALTER TYPE "public"."suggestionType" ADD VALUE 'lab_analysis';--> statement-breakpoint
ALTER TYPE "public"."suggestionType" ADD VALUE 'multi_provider_consensus';--> statement-breakpoint
CREATE TABLE "anomalyDetections" (
	"id" serial PRIMARY KEY NOT NULL,
	"detectionType" varchar(50) NOT NULL,
	"resourceType" varchar(50),
	"resourceId" integer,
	"anomalyScore" integer NOT NULL,
	"description" text,
	"features" text,
	"severity" varchar(20) DEFAULT 'medium',
	"status" varchar(20) DEFAULT 'open',
	"investigatedBy" integer,
	"investigatedAt" timestamp,
	"resolution" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "featureDefinitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"featureName" varchar(100) NOT NULL,
	"description" text,
	"featureType" "feature_type" NOT NULL,
	"source" varchar(100),
	"transformation" text,
	"validationRules" text,
	"isActive" boolean DEFAULT true,
	"version" integer DEFAULT 1,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "featureDefinitions_featureName_unique" UNIQUE("featureName")
);
--> statement-breakpoint
CREATE TABLE "mlExperiments" (
	"id" serial PRIMARY KEY NOT NULL,
	"experimentName" varchar(100) NOT NULL,
	"description" text,
	"objective" varchar(100),
	"dataset" varchar(100),
	"status" "experiment_status" DEFAULT 'running',
	"config" text,
	"metrics" text,
	"results" text,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modelDriftMonitoring" (
	"id" serial PRIMARY KEY NOT NULL,
	"modelVersionId" integer NOT NULL,
	"metricName" varchar(100) NOT NULL,
	"currentValue" integer NOT NULL,
	"baselineValue" integer NOT NULL,
	"driftScore" integer,
	"threshold" integer DEFAULT 10,
	"isAlert" boolean DEFAULT false,
	"alertSentAt" timestamp,
	"measurementPeriod" varchar(20),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modelVersions" (
	"id" serial PRIMARY KEY NOT NULL,
	"modelName" varchar(100) NOT NULL,
	"version" varchar(20) NOT NULL,
	"description" text,
	"algorithm" varchar(100),
	"hyperparameters" text,
	"trainingDataHash" varchar(64),
	"modelPath" varchar(500),
	"status" "model_status" DEFAULT 'training',
	"accuracy" integer,
	"precision" integer,
	"recall" integer,
	"f1Score" integer,
	"aucRoc" integer,
	"trainingTime" integer,
	"modelSize" integer,
	"createdBy" integer NOT NULL,
	"deployedAt" timestamp,
	"deprecatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "predictionLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"modelVersionId" integer NOT NULL,
	"consultationId" integer,
	"patientId" integer,
	"inputFeatures" text NOT NULL,
	"prediction" text NOT NULL,
	"confidence" integer,
	"actualOutcome" text,
	"feedback" text,
	"status" "prediction_status" DEFAULT 'pending',
	"processingTime" integer,
	"reviewedBy" integer,
	"reviewedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "systemMetrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"metricName" varchar(100) NOT NULL,
	"metricValue" integer NOT NULL,
	"unit" varchar(20),
	"category" varchar(50),
	"tags" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainingDatasets" (
	"id" serial PRIMARY KEY NOT NULL,
	"datasetName" varchar(100) NOT NULL,
	"description" text,
	"dataPath" varchar(500),
	"dataHash" varchar(64) NOT NULL,
	"size" integer,
	"features" text,
	"target" varchar(100),
	"splitRatio" varchar(20),
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "crm" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "specialty" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "isActive" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emailVerified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "twoFactorEnabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "twoFactorSecret" varchar(32);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lastPasswordChange" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "failedLoginAttempts" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lockedUntil" timestamp;--> statement-breakpoint
ALTER TABLE "anomalyDetections" ADD CONSTRAINT "anomalyDetections_investigatedBy_users_id_fk" FOREIGN KEY ("investigatedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featureDefinitions" ADD CONSTRAINT "featureDefinitions_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mlExperiments" ADD CONSTRAINT "mlExperiments_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modelDriftMonitoring" ADD CONSTRAINT "modelDriftMonitoring_modelVersionId_modelVersions_id_fk" FOREIGN KEY ("modelVersionId") REFERENCES "public"."modelVersions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modelVersions" ADD CONSTRAINT "modelVersions_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictionLogs" ADD CONSTRAINT "predictionLogs_modelVersionId_modelVersions_id_fk" FOREIGN KEY ("modelVersionId") REFERENCES "public"."modelVersions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictionLogs" ADD CONSTRAINT "predictionLogs_consultationId_consultations_id_fk" FOREIGN KEY ("consultationId") REFERENCES "public"."consultations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictionLogs" ADD CONSTRAINT "predictionLogs_patientId_patients_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictionLogs" ADD CONSTRAINT "predictionLogs_reviewedBy_users_id_fk" FOREIGN KEY ("reviewedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainingDatasets" ADD CONSTRAINT "trainingDatasets_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");