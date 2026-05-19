CREATE TABLE `admin_activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`admin_user_id` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`target_type` varchar(50),
	`target_id` int,
	`details` text,
	`ip_address` varchar(45),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_notification_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`admin_user_id` int NOT NULL,
	`notif_category` enum('urgent','important','normal','low') NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`pipeline` enum('instant','batch_6h','daily','weekly') NOT NULL DEFAULT 'instant',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_notification_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`notif_log_category` enum('urgent','important','normal','low') NOT NULL,
	`type` varchar(100) NOT NULL,
	`title` varchar(300) NOT NULL,
	`content` text,
	`metadata` json,
	`is_read` boolean NOT NULL DEFAULT false,
	`is_archived` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int,
	`code` varchar(50) NOT NULL,
	`name` varchar(200) NOT NULL,
	`discount_type` enum('percentage','fixed') NOT NULL,
	`discount_value` int NOT NULL,
	`min_order_amount` int DEFAULT 0,
	`max_discount_amount` int,
	`usage_limit` int,
	`used_count` int DEFAULT 0,
	`is_active` boolean DEFAULT true,
	`starts_at` timestamp,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `event_participations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` int NOT NULL,
	`user_id` int NOT NULL,
	`participation_status` enum('joined','completed','cancelled') NOT NULL DEFAULT 'joined',
	`reward_claimed` boolean DEFAULT false,
	`joined_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `event_participations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int,
	`title` varchar(300) NOT NULL,
	`description` text,
	`event_type` enum('challenge','promotion','webinar','offline','online') NOT NULL,
	`event_status` enum('draft','active','ended','cancelled') NOT NULL DEFAULT 'draft',
	`max_participants` int,
	`current_participants` int DEFAULT 0,
	`reward_points` int DEFAULT 0,
	`starts_at` timestamp,
	`ends_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `membership_tiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tier` enum('silver','gold','blue_sapphire','green_emerald','diamond','blue_diamond','platinum','black_platinum') NOT NULL,
	`name_ko` varchar(100) NOT NULL,
	`name_en` varchar(100) NOT NULL,
	`point_threshold` int NOT NULL,
	`monthly_fee` int DEFAULT 0,
	`annual_fee` int DEFAULT 0,
	`benefits` json,
	`badge_icon` varchar(255),
	`color_code` varchar(20),
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `membership_tiers_id` PRIMARY KEY(`id`),
	CONSTRAINT `membership_tiers_tier_unique` UNIQUE(`tier`)
);
--> statement-breakpoint
CREATE TABLE `operator_monitoring` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` int,
	`alert_type` enum('warning','info','recommendation') NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`severity` enum('low','medium','high') NOT NULL,
	`action_required` boolean NOT NULL DEFAULT false,
	`resolved` boolean NOT NULL DEFAULT false,
	`resolved_by` int,
	`resolved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `operator_monitoring_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `points_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` int,
	`type` enum('earn','use','expire','admin_adjust') NOT NULL,
	`points` int NOT NULL,
	`balance_after` int NOT NULL,
	`reason` varchar(255),
	`reference_type` varchar(50),
	`reference_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `points_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tiered_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` int,
	`current_stage` int DEFAULT 1,
	`days_completed` int DEFAULT 0,
	`han_jin_level` int DEFAULT 0,
	`sleep_quality` int DEFAULT 50,
	`nutrition_balance` int DEFAULT 50,
	`activity_level` int DEFAULT 50,
	`heart_health` int DEFAULT 50,
	`stress_level` int DEFAULT 50,
	`overall_wellness` int DEFAULT 50,
	`last_updated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tiered_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `tiered_progress_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `user_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` int,
	`tier` enum('silver','gold','blue_sapphire','green_emerald','diamond','blue_diamond','platinum','black_platinum') NOT NULL DEFAULT 'silver',
	`current_points` int NOT NULL DEFAULT 0,
	`total_points_earned` int NOT NULL DEFAULT 0,
	`total_points_used` int NOT NULL DEFAULT 0,
	`is_active` boolean DEFAULT true,
	`upgraded_at` timestamp,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_memberships_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `user_wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` int,
	`balance` int NOT NULL DEFAULT 0,
	`currency` varchar(10) NOT NULL DEFAULT 'KRW',
	`total_deposited` int NOT NULL DEFAULT 0,
	`total_withdrawn` int NOT NULL DEFAULT 0,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_wallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_wallets_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wallet_id` int NOT NULL,
	`user_id` int NOT NULL,
	`type` enum('deposit','withdraw','transfer_in','transfer_out','refund') NOT NULL,
	`amount` int NOT NULL,
	`balance_after` int NOT NULL,
	`payment_method` varchar(50),
	`external_tx_id` varchar(255),
	`wallet_tx_status` enum('pending','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`note` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallet_transactions_id` PRIMARY KEY(`id`)
);
