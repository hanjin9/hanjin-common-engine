CREATE TABLE `ab_experiments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`experiment_type` enum('mission','feedback','ui','notification') NOT NULL,
	`variant_a` json,
	`variant_b` json,
	`traffic_split` decimal(5,2) NOT NULL DEFAULT '50.00',
	`status` enum('draft','running','paused','completed') NOT NULL DEFAULT 'draft',
	`start_date` timestamp,
	`end_date` timestamp,
	`winner_variant` varchar(1),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ab_experiments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ab_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experiment_id` int NOT NULL,
	`user_id` int NOT NULL,
	`variant` varchar(1) NOT NULL,
	`converted` boolean NOT NULL DEFAULT false,
	`conversion_value` decimal(10,2),
	`joined_at` timestamp NOT NULL DEFAULT (now()),
	`converted_at` timestamp,
	CONSTRAINT `ab_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `anomaly_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`alert_type` enum('health_anomaly','mission_streak_broken','inactivity','vital_warning','churn_risk') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`data` json,
	`is_resolved` boolean NOT NULL DEFAULT false,
	`resolved_at` timestamp,
	`resolved_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `anomaly_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`icon_url` text,
	`category` enum('milestone','streak','ranking','social','special') NOT NULL,
	`condition` json,
	`reward_points` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`post_id` int NOT NULL,
	`user_id` int NOT NULL,
	`parent_id` int,
	`content` text NOT NULL,
	`like_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `community_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`target_type` enum('post','comment') NOT NULL,
	`target_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` int,
	`post_type` enum('workout_cert','achievement','tip','question','general') NOT NULL DEFAULT 'general',
	`content` text NOT NULL,
	`image_urls` json,
	`like_count` int NOT NULL DEFAULT 0,
	`comment_count` int NOT NULL DEFAULT 0,
	`is_public` boolean NOT NULL DEFAULT true,
	`is_pinned` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `community_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`campaign_type` enum('drip','broadcast','trigger','reengagement') NOT NULL,
	`subject` varchar(500) NOT NULL,
	`html_content` text NOT NULL,
	`target_segment` json,
	`scheduled_at` timestamp,
	`sent_at` timestamp,
	`recipient_count` int NOT NULL DEFAULT 0,
	`open_count` int NOT NULL DEFAULT 0,
	`click_count` int NOT NULL DEFAULT 0,
	`status` enum('draft','scheduled','sending','sent','paused') NOT NULL DEFAULT 'draft',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_mission_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`admin_event_id` int NOT NULL,
	`mission_id` int NOT NULL,
	`bonus_points` int NOT NULL DEFAULT 0,
	`required_completions` int NOT NULL DEFAULT 1,
	`is_required` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_mission_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exercise_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`activity_type` enum('walking','running','cycling','swimming','yoga','strength','hiit','other') NOT NULL,
	`started_at` timestamp NOT NULL,
	`ended_at` timestamp,
	`duration_minutes` int,
	`calories_burned` int,
	`distance_meters` decimal(10,2),
	`avg_heart_rate` int,
	`max_heart_rate` int,
	`is_auto_detected` boolean NOT NULL DEFAULT false,
	`source` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exercise_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `external_health_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`platform` enum('apple_health','google_fit','samsung_health','garmin_connect','strava') NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`token_expires_at` timestamp,
	`scope` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`last_sync_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `external_health_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fcm_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token` text NOT NULL,
	`platform` enum('ios','android','web') NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`last_used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fcm_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`feedback_type` enum('auto_1st','auto_2nd','manual_3rd') NOT NULL,
	`channel` enum('push','sms','email','voice','in_app') NOT NULL,
	`status` enum('pending','approved','sent','failed','cancelled') NOT NULL DEFAULT 'pending',
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`voice_url` text,
	`scheduled_at` timestamp,
	`sent_at` timestamp,
	`approved_by` int,
	`approved_at` timestamp,
	`rank_tier` varchar(50),
	`trigger_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedback_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `franchise_settlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`total_revenue` decimal(12,2) NOT NULL,
	`platform_fee_rate` decimal(5,4) NOT NULL,
	`platform_fee` decimal(12,2) NOT NULL,
	`franchisee_amount` decimal(12,2) NOT NULL,
	`member_count` int NOT NULL,
	`status` enum('pending','processing','completed','disputed') NOT NULL DEFAULT 'pending',
	`settled_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `franchise_settlements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `health_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`step_number` int NOT NULL,
	`title` varchar(128) NOT NULL,
	`description` text,
	`category` varchar(64) NOT NULL,
	`icon_name` varchar(64),
	`color_hex` varchar(7) DEFAULT '#3b82f6',
	`is_active` boolean NOT NULL DEFAULT true,
	`sort_order` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `health_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `i18n_translations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locale` varchar(10) NOT NULL,
	`namespace` varchar(100) NOT NULL,
	`key` varchar(500) NOT NULL,
	`value` text NOT NULL,
	`is_approved` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `i18n_translations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lifecycle_stages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`stage` enum('new','onboarding','active','at_risk','churned','reactivated') NOT NULL,
	`previous_stage` varchar(50),
	`transition_reason` text,
	`automation_triggered` boolean NOT NULL DEFAULT false,
	`entered_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lifecycle_stages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mission_curations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`week_start_date` timestamp NOT NULL,
	`recommended_missions` json,
	`ai_reason` text,
	`accepted_missions` json,
	`status` enum('pending','accepted','rejected','expired') NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mission_curations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mission_step_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mission_id` int NOT NULL,
	`health_step_id` int NOT NULL,
	`sort_order` int DEFAULT 0,
	CONSTRAINT `mission_step_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mobile_api_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token` varchar(512) NOT NULL,
	`platform` enum('ios','android') NOT NULL,
	`app_version` varchar(50),
	`device_info` json,
	`is_active` boolean NOT NULL DEFAULT true,
	`last_used_at` timestamp,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mobile_api_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monthly_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`report_data` json,
	`pdf_url` text,
	`generated_at` timestamp NOT NULL DEFAULT (now()),
	`sent_at` timestamp,
	CONSTRAINT `monthly_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prediction_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`prediction_type` enum('churn_risk','health_risk','engagement_score','upgrade_probability') NOT NULL,
	`score` decimal(5,4) NOT NULL,
	`confidence` decimal(5,4),
	`factors` json,
	`recommendation` text,
	`predicted_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp,
	CONSTRAINT `prediction_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `premium_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`product_type` enum('mission_pack','coaching_session','report','course','tool') NOT NULL,
	`price_krw` int NOT NULL,
	`price_points` int,
	`content_url` text,
	`thumbnail_url` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`sales_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `premium_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `premium_purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`product_id` int NOT NULL,
	`payment_method` enum('stripe','points','mixed') NOT NULL,
	`amount_krw` int,
	`points_used` int,
	`stripe_payment_intent_id` varchar(255),
	`status` enum('pending','completed','refunded') NOT NULL DEFAULT 'pending',
	`purchased_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `premium_purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `realtime_bio_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`wearable_connection_id` int,
	`heart_rate` int,
	`blood_oxygen` decimal(5,2),
	`blood_pressure_systolic` int,
	`blood_pressure_diastolic` int,
	`stress_level` int,
	`calories_burned` int,
	`steps` int,
	`active_minutes` int,
	`measured_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `realtime_bio_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reward_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`trigger_event` varchar(100) NOT NULL,
	`points_amount` int NOT NULL,
	`multiplier` decimal(5,2) NOT NULL DEFAULT '1.00',
	`max_per_day` int,
	`is_active` boolean NOT NULL DEFAULT true,
	`valid_from` timestamp,
	`valid_until` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reward_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_challenge_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challenge_id` int NOT NULL,
	`user_id` int NOT NULL,
	`team_name` varchar(100),
	`current_value` int NOT NULL DEFAULT 0,
	`joined_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_challenge_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`project_id` int,
	`mission_id` int,
	`max_team_size` int NOT NULL DEFAULT 5,
	`target_value` int NOT NULL,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp NOT NULL,
	`reward_points` int NOT NULL DEFAULT 0,
	`status` enum('upcoming','active','completed','cancelled') NOT NULL DEFAULT 'upcoming',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`badge_id` int NOT NULL,
	`earned_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wearable_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`platform` enum('apple_watch','galaxy_watch','fitbit','garmin','polar','whoop') NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`token_expires_at` timestamp,
	`device_id` varchar(255),
	`device_name` varchar(255),
	`is_active` boolean NOT NULL DEFAULT true,
	`last_sync_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wearable_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `membership_tiers` MODIFY COLUMN `tier` enum('bronze','silver','gold','emerald','green_emerald','sapphire','blue_sapphire','diamond','blue_diamond','platinum','black_platinum') NOT NULL;--> statement-breakpoint
ALTER TABLE `user_memberships` MODIFY COLUMN `tier` enum('bronze','silver','gold','emerald','green_emerald','sapphire','blue_sapphire','diamond','blue_diamond','platinum','black_platinum') NOT NULL DEFAULT 'bronze';