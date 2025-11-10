CREATE TABLE `aiExplanations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`suggestionId` int NOT NULL,
	`reasoning` text NOT NULL,
	`keyFactors` text,
	`evidenceLinks` text,
	`alternativeOptions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiExplanations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataRetentionPolicy` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`retentionPeriodMonths` int DEFAULT 36,
	`deletionScheduledDate` timestamp,
	`deletionCompletedDate` timestamp,
	`deletionReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dataRetentionPolicy_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patientConsent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`consentType` enum('data_processing','ai_analysis','research','data_sharing') NOT NULL,
	`consentGiven` boolean NOT NULL,
	`consentDate` timestamp NOT NULL,
	`expiryDate` timestamp,
	`documentUrl` varchar(500),
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `patientConsent_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suggestionFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`suggestionId` int NOT NULL,
	`doctorId` int NOT NULL,
	`approved` boolean NOT NULL,
	`feedback` text,
	`clinicalRelevance` int,
	`accuracy` int,
	`usefulness` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `suggestionFeedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `aiExplanations` ADD CONSTRAINT `aiExplanations_suggestionId_aiSuggestions_id_fk` FOREIGN KEY (`suggestionId`) REFERENCES `aiSuggestions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dataRetentionPolicy` ADD CONSTRAINT `dataRetentionPolicy_patientId_patients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patientConsent` ADD CONSTRAINT `patientConsent_patientId_patients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suggestionFeedback` ADD CONSTRAINT `suggestionFeedback_suggestionId_aiSuggestions_id_fk` FOREIGN KEY (`suggestionId`) REFERENCES `aiSuggestions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suggestionFeedback` ADD CONSTRAINT `suggestionFeedback_doctorId_users_id_fk` FOREIGN KEY (`doctorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;