CREATE TABLE `rate_limits` (
	`subject` text NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`subject`, `window_start`)
);
--> statement-breakpoint
CREATE INDEX `idx_rate_limits_window_start` ON `rate_limits` (`window_start`);