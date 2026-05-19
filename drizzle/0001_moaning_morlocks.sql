CREATE TABLE `project_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`user_id` int,
	`action` varchar(255) NOT NULL,
	`resource_type` varchar(100),
	`resource_id` int,
	`details` json,
	`ip_address` varchar(45),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_auth_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`auth_provider` enum('manus','supabase','auth0','custom') NOT NULL DEFAULT 'manus',
	`oauth_google_enabled` boolean DEFAULT false,
	`oauth_kakao_enabled` boolean DEFAULT false,
	`oauth_google_client_id` varchar(255),
	`oauth_kakao_client_id` varchar(255),
	`stripe_account_id` varchar(255),
	`stripe_publishable_key` varchar(255),
	`email_provider` enum('resend','sendgrid','custom') NOT NULL DEFAULT 'resend',
	`email_from_address` varchar(255),
	`email_from_name` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_auth_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_auth_config_project_id_unique` UNIQUE(`project_id`)
);
--> statement-breakpoint
CREATE TABLE `project_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`user_id` int NOT NULL,
	`role` enum('admin','manager','user') NOT NULL DEFAULT 'user',
	`joined_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_notification_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`email_on_new_user` boolean DEFAULT true,
	`email_on_payment_success` boolean DEFAULT true,
	`email_on_payment_failed` boolean DEFAULT true,
	`email_on_subscription_cancelled` boolean DEFAULT true,
	`email_on_subscription_expiring` boolean DEFAULT true,
	`admin_email_recipients` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_notification_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_notification_settings_project_id_unique` UNIQUE(`project_id`)
);
--> statement-breakpoint
CREATE TABLE `project_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`user_id` int NOT NULL,
	`subscription_id` int,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'USD',
	`status` enum('pending','succeeded','failed','refunded') NOT NULL DEFAULT 'pending',
	`stripe_payment_intent_id` varchar(255),
	`stripe_invoice_id` varchar(255),
	`payment_method` varchar(50),
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_statistics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`total_users` int DEFAULT 0,
	`active_subscriptions` int DEFAULT 0,
	`total_revenue` decimal(12,2) DEFAULT '0',
	`monthly_revenue` decimal(12,2) DEFAULT '0',
	`churn_rate` decimal(5,2) DEFAULT '0',
	`avg_subscription_value` decimal(10,2) DEFAULT '0',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_statistics_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_statistics_project_id_unique` UNIQUE(`project_id`)
);
--> statement-breakpoint
CREATE TABLE `project_subscription_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'USD',
	`billing_period` enum('monthly','yearly') NOT NULL DEFAULT 'monthly',
	`features` json,
	`is_active` boolean DEFAULT true,
	`stripe_price_id` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_subscription_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`user_id` int NOT NULL,
	`plan_id` int NOT NULL,
	`stripe_subscription_id` varchar(255),
	`status` enum('active','paused','cancelled','expired') NOT NULL DEFAULT 'active',
	`current_period_start` datetime,
	`current_period_end` datetime,
	`cancelled_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_webhook_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`event_type` varchar(255) NOT NULL,
	`provider` varchar(50),
	`payload` json NOT NULL,
	`status` enum('pending','processed','failed','retry') NOT NULL DEFAULT 'pending',
	`retry_count` int DEFAULT 0,
	`error_message` text,
	`processed_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_webhook_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`owner_id` int NOT NULL,
	`project_type` enum('glwa_franchise','glwa_community','breathing','sports_recovery','accounting','lottery','landing') NOT NULL,
	`ownership_status` enum('hanjin','client_pending','client_active') NOT NULL DEFAULT 'hanjin',
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_slug_unique` UNIQUE(`slug`)
);
