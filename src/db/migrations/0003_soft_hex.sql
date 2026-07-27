CREATE TABLE `api_call_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`product_id` int NOT NULL,
	`api_key_id` int,
	`request_body` json,
	`response_body` json,
	`provider_name` varchar(50),
	`provider_ref` varchar(100),
	`http_status` int,
	`status` varchar(20) NOT NULL,
	`cost` decimal(10,2) NOT NULL DEFAULT '0.00',
	`duration_ms` int,
	`client_ip` varchar(45),
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `api_call_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`key_hash` char(64) NOT NULL,
	`key_prefix` varchar(12) NOT NULL,
	`label` varchar(100),
	`ip_allowlist` text,
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`last_used_at` datetime,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `api_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`provider_id` int,
	`default_price` decimal(10,2) NOT NULL,
	`our_cost` decimal(10,2),
	`status` varchar(20) DEFAULT 'active',
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `api_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_code_idx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `client_api_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`product_id` int NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`enabled_by` int,
	`enabled_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `client_api_access_id` PRIMARY KEY(`id`),
	CONSTRAINT `access_client_product_idx` UNIQUE(`client_id`,`product_id`)
);
--> statement-breakpoint
CREATE TABLE `client_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`product_id` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`updated_by` int,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `client_pricing_id` PRIMARY KEY(`id`),
	CONSTRAINT `pricing_client_product_idx` UNIQUE(`client_id`,`product_id`)
);
--> statement-breakpoint
CREATE TABLE `providers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`base_url` varchar(255),
	`status` varchar(20) DEFAULT 'active',
	CONSTRAINT `providers_id` PRIMARY KEY(`id`),
	CONSTRAINT `provider_code_idx` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `api_call_logs` ADD CONSTRAINT `api_call_logs_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `api_call_logs` ADD CONSTRAINT `api_call_logs_product_id_api_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `api_products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `api_products` ADD CONSTRAINT `api_products_provider_id_providers_id_fk` FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_api_access` ADD CONSTRAINT `client_api_access_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_api_access` ADD CONSTRAINT `client_api_access_product_id_api_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `api_products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_api_access` ADD CONSTRAINT `client_api_access_enabled_by_admin_users_id_fk` FOREIGN KEY (`enabled_by`) REFERENCES `admin_users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_pricing` ADD CONSTRAINT `client_pricing_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_pricing` ADD CONSTRAINT `client_pricing_product_id_api_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `api_products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_pricing` ADD CONSTRAINT `client_pricing_updated_by_admin_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `admin_users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `log_client_created_idx` ON `api_call_logs` (`client_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `log_status_created_idx` ON `api_call_logs` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `key_prefix_idx` ON `api_keys` (`key_prefix`);