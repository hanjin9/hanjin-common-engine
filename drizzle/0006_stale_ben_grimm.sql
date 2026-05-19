CREATE TABLE `membership_copy` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_slug` varchar(50) NOT NULL,
	`copy_key` varchar(100) NOT NULL,
	`copy_text` text NOT NULL,
	`copy_type` varchar(30) DEFAULT 'text',
	`is_active` boolean DEFAULT true,
	`sort_order` int DEFAULT 0,
	`updated_by` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `membership_copy_id` PRIMARY KEY(`id`)
);
