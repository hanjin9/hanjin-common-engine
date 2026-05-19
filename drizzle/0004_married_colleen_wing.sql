CREATE TABLE `project_membership_tiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_slug` varchar(64) NOT NULL,
	`tier_order` int NOT NULL,
	`tier_key` varchar(64) NOT NULL,
	`tier_label` varchar(128) NOT NULL,
	`tier_color` varchar(16) DEFAULT '#94a3b8',
	`point_threshold` int NOT NULL DEFAULT 0,
	`annual_fee_krw` int DEFAULT 0,
	`benefits` text,
	`auto_upgrade` boolean DEFAULT false,
	`is_active` boolean DEFAULT true,
	`parent_project_slug` varchar(64),
	`parent_tier_key` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_membership_tiers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_user_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_slug` varchar(64) NOT NULL,
	`current_tier_key` varchar(64) NOT NULL,
	`current_points` int DEFAULT 0,
	`total_points_earned` int DEFAULT 0,
	`total_points_used` int DEFAULT 0,
	`annual_fee_paid` boolean DEFAULT false,
	`annual_fee_paid_at` timestamp,
	`tier_changed_at` timestamp DEFAULT (now()),
	`tier_change_reason` text,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_user_memberships_id` PRIMARY KEY(`id`)
);
