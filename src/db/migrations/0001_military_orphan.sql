CREATE TABLE `client_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`doc_type_id` int NOT NULL,
	`file_path` varchar(500) NOT NULL,
	`file_name` varchar(255),
	`file_size` int,
	`mime_type` varchar(100),
	`doc_number` varchar(100),
	`uploaded_by_type` varchar(10) NOT NULL,
	`uploaded_by_id` int NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`remarks` text,
	`reviewed_by` int,
	`reviewed_at` datetime,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `client_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`is_mandatory` boolean NOT NULL DEFAULT true,
	`status` varchar(20) DEFAULT 'active',
	CONSTRAINT `document_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `doc_code_idx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `topup_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wallet_id` int NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`bank_ref` varchar(100) NOT NULL,
	`transfer_mode` varchar(20),
	`transfer_date` date,
	`proof_path` varchar(500),
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`remarks` text,
	`submitted_by` int,
	`reviewed_by` int,
	`reviewed_at` datetime,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `topup_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `bank_ref_idx` UNIQUE(`bank_ref`)
);
--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`wallet_id` int NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`type` varchar(20) NOT NULL,
	`reference` varchar(100),
	`balance_after` decimal(15,2) NOT NULL,
	`notes` varchar(255),
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `wallet_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`kind` varchar(20) NOT NULL DEFAULT 'recharge',
	`balance` decimal(15,2) NOT NULL DEFAULT '0.00',
	`currency` char(3) NOT NULL DEFAULT 'INR',
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_kind_idx` UNIQUE(`client_id`,`kind`)
);
--> statement-breakpoint
ALTER TABLE `client_documents` ADD CONSTRAINT `client_documents_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_documents` ADD CONSTRAINT `client_documents_doc_type_id_document_types_id_fk` FOREIGN KEY (`doc_type_id`) REFERENCES `document_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_documents` ADD CONSTRAINT `client_documents_reviewed_by_admin_users_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `admin_users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `topup_requests` ADD CONSTRAINT `topup_requests_wallet_id_wallets_id_fk` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `topup_requests` ADD CONSTRAINT `topup_requests_reviewed_by_admin_users_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `admin_users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_wallet_id_wallets_id_fk` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallets` ADD CONSTRAINT `wallets_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `client_status_idx` ON `client_documents` (`client_id`,`status`);--> statement-breakpoint
CREATE INDEX `topup_status_idx` ON `topup_requests` (`status`);--> statement-breakpoint
CREATE INDEX `wallet_created_idx` ON `wallet_transactions` (`wallet_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `reference_idx` ON `wallet_transactions` (`reference`);