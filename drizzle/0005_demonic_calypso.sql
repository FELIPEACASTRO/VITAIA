CREATE TABLE `clinicalGuidelines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`specialtyId` int NOT NULL,
	`condition` varchar(255) NOT NULL,
	`guidelineContent` text NOT NULL,
	`source` varchar(255),
	`publicationYear` int,
	`version` varchar(50),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinicalGuidelines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultationSpecialty` (
	`id` int AUTO_INCREMENT NOT NULL,
	`consultationId` int NOT NULL,
	`specialtyId` int NOT NULL,
	`primaryDiagnosis` varchar(255),
	`icdCode` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consultationSpecialty_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `doctorSpecialties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doctorId` int NOT NULL,
	`specialtyId` int NOT NULL,
	`licenseNumber` varchar(100),
	`yearsOfExperience` int,
	`isPrimary` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `doctorSpecialties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicalSpecialties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`englishName` varchar(100) NOT NULL,
	`description` text,
	`icd10Code` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `medicalSpecialties_id` PRIMARY KEY(`id`),
	CONSTRAINT `medicalSpecialties_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `specialtyDiagnosticTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`specialtyId` int NOT NULL,
	`testName` varchar(255) NOT NULL,
	`testCode` varchar(100),
	`description` text,
	`normalRange` varchar(255),
	`interpretationGuidelines` text,
	`commonIndications` text,
	`sampleType` varchar(100),
	`turnaroundTime` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `specialtyDiagnosticTests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `specialtyMedications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`specialtyId` int NOT NULL,
	`medicationName` varchar(255) NOT NULL,
	`activeIngredient` varchar(255),
	`dosageForm` varchar(100),
	`recommendedDose` varchar(255),
	`indications` text,
	`contraindications` text,
	`sideEffects` text,
	`interactions` text,
	`atcCode` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `specialtyMedications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `specialtyProcedures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`specialtyId` int NOT NULL,
	`procedureName` varchar(255) NOT NULL,
	`procedureCode` varchar(100),
	`description` text,
	`indications` text,
	`contraindications` text,
	`complications` text,
	`estimatedDuration` varchar(100),
	`recoveryTime` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `specialtyProcedures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `clinicalGuidelines` ADD CONSTRAINT `clinicalGuidelines_specialtyId_medicalSpecialties_id_fk` FOREIGN KEY (`specialtyId`) REFERENCES `medicalSpecialties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultationSpecialty` ADD CONSTRAINT `consultationSpecialty_consultationId_consultations_id_fk` FOREIGN KEY (`consultationId`) REFERENCES `consultations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultationSpecialty` ADD CONSTRAINT `consultationSpecialty_specialtyId_medicalSpecialties_id_fk` FOREIGN KEY (`specialtyId`) REFERENCES `medicalSpecialties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `doctorSpecialties` ADD CONSTRAINT `doctorSpecialties_doctorId_users_id_fk` FOREIGN KEY (`doctorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `doctorSpecialties` ADD CONSTRAINT `doctorSpecialties_specialtyId_medicalSpecialties_id_fk` FOREIGN KEY (`specialtyId`) REFERENCES `medicalSpecialties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `specialtyDiagnosticTests` ADD CONSTRAINT `specialtyDiagnosticTests_specialtyId_medicalSpecialties_id_fk` FOREIGN KEY (`specialtyId`) REFERENCES `medicalSpecialties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `specialtyMedications` ADD CONSTRAINT `specialtyMedications_specialtyId_medicalSpecialties_id_fk` FOREIGN KEY (`specialtyId`) REFERENCES `medicalSpecialties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `specialtyProcedures` ADD CONSTRAINT `specialtyProcedures_specialtyId_medicalSpecialties_id_fk` FOREIGN KEY (`specialtyId`) REFERENCES `medicalSpecialties`(`id`) ON DELETE no action ON UPDATE no action;