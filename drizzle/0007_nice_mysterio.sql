CREATE TABLE `sleep_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(100) NOT NULL,
	`sleep_start` timestamp NOT NULL,
	`sleep_end` timestamp,
	`duration_minutes` int,
	`record_type` enum('auto','manual') NOT NULL DEFAULT 'auto',
	`quality_score` int,
	`notes` text,
	`data_source` varchar(50) NOT NULL DEFAULT 'self',
	`points_awarded` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sleep_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sleep_tracking_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(100) NOT NULL,
	`auto_track_enabled` boolean NOT NULL DEFAULT true,
	`opted_out` boolean NOT NULL DEFAULT false,
	`opted_out_at` timestamp,
	`sleep_start_hour` int NOT NULL DEFAULT 22,
	`sleep_end_hour` int NOT NULL DEFAULT 8,
	`min_sleep_minutes` int NOT NULL DEFAULT 30,
	`notifications_enabled` boolean NOT NULL DEFAULT true,
	`last_auto_recorded_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sleep_tracking_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `sleep_tracking_settings_user_id_unique` UNIQUE(`user_id`)
);
