CREATE TABLE `admin_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_slug` varchar(64) NOT NULL DEFAULT 'all',
	`title` varchar(256) NOT NULL,
	`content` text NOT NULL,
	`send_type` enum('scheduled','instant','recurring') NOT NULL DEFAULT 'instant',
	`target_audience` enum('all','top_1pct','top_5pct','top_10pct','bottom_20pct','inactive') NOT NULL DEFAULT 'all',
	`scheduled_at` timestamp,
	`recurring_cron` varchar(64),
	`send_status` enum('draft','scheduled','sending','sent','canceled') NOT NULL DEFAULT 'draft',
	`sent_at` timestamp,
	`sent_count` int DEFAULT 0,
	`open_count` int DEFAULT 0,
	`created_by` varchar(100) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mission_completions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mission_id` int NOT NULL,
	`user_id` varchar(100) NOT NULL,
	`project_slug` varchar(64) NOT NULL DEFAULT 'all',
	`points_awarded` int NOT NULL DEFAULT 0,
	`feedback_sent` boolean NOT NULL DEFAULT false,
	`feedback_content` text,
	`completed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mission_completions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `missions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_slug` varchar(64) NOT NULL DEFAULT 'all',
	`title` varchar(256) NOT NULL,
	`description` text,
	`mission_type` enum('scheduled','optional') NOT NULL DEFAULT 'optional',
	`category` enum('breathing','exercise','sleep','nutrition','meditation','quiz','custom') NOT NULL DEFAULT 'custom',
	`points_reward` int NOT NULL DEFAULT 10,
	`scheduled_time` varchar(8),
	`scheduled_days` varchar(32),
	`duration_minutes` int DEFAULT 10,
	`is_active` boolean NOT NULL DEFAULT true,
	`sort_order` int DEFAULT 99,
	`created_by` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `missions_id` PRIMARY KEY(`id`)
);
