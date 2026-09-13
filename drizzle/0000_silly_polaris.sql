CREATE TABLE `evidence_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recommendation_id` text NOT NULL,
	`layer` text NOT NULL,
	`source` text NOT NULL,
	`signal_score` real NOT NULL,
	`direction` text NOT NULL,
	`value_payload` text NOT NULL,
	`captured_at` text NOT NULL,
	FOREIGN KEY (`recommendation_id`) REFERENCES `recommendations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_evidence_recommendation_layer` ON `evidence_snapshots` (`recommendation_id`,`layer`);--> statement-breakpoint
CREATE TABLE `expert_market_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`expert_id` text NOT NULL,
	`market_type` text NOT NULL,
	`wins` integer NOT NULL,
	`losses` integer NOT NULL,
	`pushes` integer DEFAULT 0 NOT NULL,
	`units` real NOT NULL,
	`roi` real NOT NULL,
	`sample_adjusted_rate` real NOT NULL,
	`period_start` text,
	`period_end` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`expert_id`) REFERENCES `experts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_expert_records_expert_market` ON `expert_market_records` (`expert_id`,`market_type`);--> statement-breakpoint
CREATE TABLE `experts` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`source` text NOT NULL,
	`profile_url` text,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`season` integer NOT NULL,
	`week` integer NOT NULL,
	`game_date` text NOT NULL,
	`game_time` text NOT NULL,
	`away_team` text NOT NULL,
	`home_team` text NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`source` text NOT NULL,
	`source_payload` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_games_season_week` ON `games` (`season`,`week`);--> statement-breakpoint
CREATE INDEX `idx_games_game_date` ON `games` (`game_date`);--> statement-breakpoint
CREATE TABLE `recommendation_results` (
	`recommendation_id` text PRIMARY KEY NOT NULL,
	`closing_line` text,
	`closing_american_odds` integer,
	`result` text DEFAULT 'pending' NOT NULL,
	`profit_loss_units` real,
	`closing_line_value` real,
	`settled_at` text,
	FOREIGN KEY (`recommendation_id`) REFERENCES `recommendations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_results_result` ON `recommendation_results` (`result`);--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`recommended_at` text NOT NULL,
	`market_type` text NOT NULL,
	`bet_label` text NOT NULL,
	`line_at_recommendation` text NOT NULL,
	`american_odds` integer NOT NULL,
	`estimated_probability` real NOT NULL,
	`implied_probability` real NOT NULL,
	`model_edge` real NOT NULL,
	`confidence` integer NOT NULL,
	`grade` text NOT NULL,
	`expert_agreement` real NOT NULL,
	`market_signal` real NOT NULL,
	`context_signal` real NOT NULL,
	`conflict` integer DEFAULT false NOT NULL,
	`model_version` text NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_recommendations_recommended_at` ON `recommendations` (`recommended_at`);--> statement-breakpoint
CREATE INDEX `idx_recommendations_market_confidence` ON `recommendations` (`market_type`,`confidence`);--> statement-breakpoint
CREATE INDEX `idx_recommendations_game_id` ON `recommendations` (`game_id`);
--> statement-breakpoint
PRAGMA optimize;
