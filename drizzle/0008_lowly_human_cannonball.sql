CREATE TABLE `project_registry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`project_type` enum('membership','subscription','community') NOT NULL DEFAULT 'subscription',
	`parent_slug` varchar(64),
	`max_tiers` int DEFAULT 10,
	`bio_tracking_enabled` boolean DEFAULT false,
	`ai_feedback_level` enum('none','basic','full') DEFAULT 'none',
	`stripe_product_id` varchar(128),
	`icon` varchar(256),
	`theme_color` varchar(16) DEFAULT '#6366f1',
	`sort_order` int DEFAULT 99,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_registry_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_registry_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `stripe_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(100) NOT NULL,
	`project_slug` varchar(64) NOT NULL,
	`stripe_payment_intent_id` varchar(128),
	`stripe_invoice_id` varchar(128),
	`amount_krw` int,
	`currency` varchar(8) DEFAULT 'krw',
	`status` enum('succeeded','pending','failed','refunded') DEFAULT 'pending',
	`description` varchar(256),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stripe_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stripe_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(100) NOT NULL,
	`project_slug` varchar(64) NOT NULL,
	`stripe_customer_id` varchar(128),
	`stripe_subscription_id` varchar(128),
	`stripe_price_id` varchar(128),
	`status` enum('active','canceled','past_due','trialing','incomplete') DEFAULT 'incomplete',
	`tier_key` varchar(64),
	`current_period_start` timestamp,
	`current_period_end` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stripe_subscriptions_id` PRIMARY KEY(`id`)
);
