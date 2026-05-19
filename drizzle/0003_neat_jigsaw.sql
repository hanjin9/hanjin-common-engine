CREATE TABLE `biodata_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` int,
	`data_source` enum('self','google_fit','apple_health','samsung_health','manual') NOT NULL DEFAULT 'self',
	`data_type` enum('heart_rate','breathing_rate','breathing_quality','sleep_duration','sleep_quality','sleep_start','sleep_end','snoring_detected','steps','voice_energy','voice_stress','stress_level','body_temperature','weight','mood','energy_level') NOT NULL,
	`value` varchar(64) NOT NULL,
	`unit` varchar(32),
	`accuracy` int DEFAULT 70,
	`measured_at` timestamp NOT NULL DEFAULT (now()),
	`duration_seconds` int,
	`raw_data` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `biodata_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` int,
	`session_id` varchar(64) NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`detected_emotion` enum('positive','negative','tired','neutral','excited','anxious') DEFAULT 'neutral',
	`language` varchar(8) DEFAULT 'ko',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_missions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` int,
	`mission_date` varchar(10) NOT NULL,
	`mission_type` enum('breathing','exercise','meditation','nutrition','sleep','quiz','measurement') NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`instructions` text,
	`difficulty` int DEFAULT 1,
	`estimated_minutes` int DEFAULT 10,
	`mission_status` enum('pending','in_progress','completed','skipped') DEFAULT 'pending',
	`completed_at` timestamp,
	`completion_data` text,
	`reward_points` int DEFAULT 10,
	`points_earned` int DEFAULT 0,
	`notification_sent` boolean DEFAULT false,
	`notification_sent_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_missions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` int,
	`feedback_tier` int NOT NULL DEFAULT 1,
	`feedback_type` enum('activity','daily','sleep','breathing','mission','weekly','vip_coaching') NOT NULL,
	`trigger_type` varchar(64),
	`trigger_data` text,
	`feedback_content` text NOT NULL,
	`feedback_summary` varchar(500),
	`language` varchar(8) DEFAULT 'ko',
	`points_awarded` int DEFAULT 0,
	`user_reaction` enum('none','liked','disliked','read') DEFAULT 'none',
	`tts_audio_url` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `health_platform_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`platform` enum('google_fit','apple_health','samsung_health','garmin','fitbit') NOT NULL,
	`connection_status` enum('connected','disconnected','pending') DEFAULT 'pending',
	`access_token` text,
	`refresh_token` text,
	`token_expires_at` timestamp,
	`sync_enabled` boolean DEFAULT true,
	`last_sync_at` timestamp,
	`sync_data_types` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `health_platform_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sleep_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` int,
	`sleep_start` timestamp NOT NULL,
	`sleep_end` timestamp,
	`total_minutes` int,
	`quality_score` int,
	`avg_breathing_rate` varchar(16),
	`breathing_regularity` int,
	`snoring_detected` boolean DEFAULT false,
	`snoring_minutes` int DEFAULT 0,
	`movement_count` int DEFAULT 0,
	`sleep_stages` text,
	`detection_method` enum('accelerometer','microphone','both','manual') DEFAULT 'both',
	`feedback_generated` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sleep_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_feedback_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` int,
	`personality_type` enum('active','careful','social','independent','balanced') DEFAULT 'balanced',
	`motivation_factors` text,
	`strengths` text,
	`improvements` text,
	`preferred_language` varchar(8) DEFAULT 'ko',
	`feedback_tier` int DEFAULT 1,
	`total_feedback_count` int DEFAULT 0,
	`last_analyzed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_feedback_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_feedback_profiles_user_id_unique` UNIQUE(`user_id`)
);
