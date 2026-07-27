CREATE TABLE `admin_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(150),
	`email` varchar(150) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` varchar(30) NOT NULL,
	`last_login_at` datetime,
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_email_idx` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `client_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`name` varchar(150),
	`email` varchar(150) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`last_login_at` datetime,
	`last_login_ip` varchar(45),
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `client_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_idx` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`company_name` varchar(200),
	`email` varchar(150),
	`phone` varchar(20),
	`gstin` varchar(20),
	`address` text,
	`kyc_status` varchar(20) NOT NULL DEFAULT 'pending',
	`kyc_verified_at` datetime,
	`kyc_verified_by` int,
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `client_users` ADD CONSTRAINT `client_users_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;