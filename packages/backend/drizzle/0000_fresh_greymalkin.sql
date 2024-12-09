CREATE TABLE `component` (
	`id` text PRIMARY KEY NOT NULL,
	`uniqueInteractionId` text NOT NULL,
	`name` text NOT NULL,
	`renders` integer NOT NULL,
	`instances` integer NOT NULL,
	`total_time` integer,
	`self_time` integer,
	`interactionId` text NOT NULL,
	FOREIGN KEY (`uniqueInteractionId`) REFERENCES `interaction`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `interaction` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`time` integer NOT NULL,
	`timestamp` integer NOT NULL,
	`route` text,
	`url` text NOT NULL,
	`unique_interaction_id` text NOT NULL,
	`interactionId` text NOT NULL,
	`component_path` text NOT NULL,
	`projectId` text,
	`session` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interaction_to_replay` (
	`id` text PRIMARY KEY NOT NULL,
	`interactionId` text NOT NULL,
	`replayId` text NOT NULL,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `replay` (
	`id` text PRIMARY KEY NOT NULL,
	`events` text NOT NULL
);
