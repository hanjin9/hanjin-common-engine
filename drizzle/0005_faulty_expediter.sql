CREATE TABLE `membership_policy_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_slug` varchar(100) NOT NULL,
	`tier_key` varchar(50) NOT NULL,
	`tier_label` varchar(100) NOT NULL,
	`changed_by` varchar(255) NOT NULL,
	`changed_by_name` varchar(255),
	`change_type` enum('benefits_update','fee_update','point_threshold','color_update','label_update','status_toggle','policy_note','full_update') NOT NULL,
	`previous_value` text,
	`new_value` text NOT NULL,
	`change_note` text,
	`effective_date` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `membership_policy_history_id` PRIMARY KEY(`id`)
);
