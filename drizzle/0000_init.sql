CREATE TABLE `event_recipes` (
	`event_name` text NOT NULL,
	`recipe_name` text NOT NULL,
	`amount` integer NOT NULL,
	PRIMARY KEY(`event_name`, `recipe_name`),
	FOREIGN KEY (`event_name`) REFERENCES `events`(`name`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipe_name`) REFERENCES `recipes`(`name`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `events` (
	`name` text PRIMARY KEY NOT NULL,
	`price` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ingredients` (
	`name` text PRIMARY KEY NOT NULL,
	`price` real DEFAULT 0 NOT NULL,
	`alcohol` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `recipe_ingredients` (
	`recipe_name` text NOT NULL,
	`ingredient_name` text NOT NULL,
	`amount` real NOT NULL,
	PRIMARY KEY(`recipe_name`, `ingredient_name`),
	FOREIGN KEY (`recipe_name`) REFERENCES `recipes`(`name`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ingredient_name`) REFERENCES `ingredients`(`name`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`name` text PRIMARY KEY NOT NULL,
	`description` text,
	`price` real DEFAULT 0 NOT NULL,
	`alcohol` integer DEFAULT false NOT NULL
);
