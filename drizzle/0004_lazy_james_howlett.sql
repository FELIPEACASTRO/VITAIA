CREATE TABLE `hl7FhirMapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`externalEhrId` varchar(255) NOT NULL,
	`ehrSystem` varchar(100) NOT NULL,
	`fhirResourceType` varchar(100),
	`fhirData` text,
	`lastSyncDate` timestamp,
	`syncStatus` enum('pending','synced','failed') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hl7FhirMapping_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicalImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`consultationId` int NOT NULL,
	`patientId` int NOT NULL,
	`imageType` varchar(100) NOT NULL,
	`imageUrl` varchar(500) NOT NULL,
	`imageKey` varchar(255) NOT NULL,
	`description` text,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`analyzedAt` timestamp,
	`aiAnalysisResult` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `medicalImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `researchParticipant` (
	`id` int AUTO_INCREMENT NOT NULL,
	`protocolId` int NOT NULL,
	`patientId` int NOT NULL,
	`enrollmentDate` timestamp NOT NULL DEFAULT (now()),
	`withdrawalDate` timestamp,
	`consentDocumentUrl` varchar(500),
	`consentGiven` boolean DEFAULT false,
	`status` enum('enrolled','active','completed','withdrawn') DEFAULT 'enrolled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `researchParticipant_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `researchProtocol` (
	`id` int AUTO_INCREMENT NOT NULL,
	`protocolName` varchar(255) NOT NULL,
	`description` text,
	`principalInvestigator` varchar(255) NOT NULL,
	`institution` varchar(255),
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`status` enum('draft','active','completed','suspended') DEFAULT 'draft',
	`ethicsApprovalNumber` varchar(100),
	`ethicsApprovalDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `researchProtocol_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `hl7FhirMapping` ADD CONSTRAINT `hl7FhirMapping_patientId_patients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medicalImages` ADD CONSTRAINT `medicalImages_consultationId_consultations_id_fk` FOREIGN KEY (`consultationId`) REFERENCES `consultations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medicalImages` ADD CONSTRAINT `medicalImages_patientId_patients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `researchParticipant` ADD CONSTRAINT `researchParticipant_protocolId_researchProtocol_id_fk` FOREIGN KEY (`protocolId`) REFERENCES `researchProtocol`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `researchParticipant` ADD CONSTRAINT `researchParticipant_patientId_patients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE no action ON UPDATE no action;