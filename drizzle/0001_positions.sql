ALTER TABLE `event_recipes` ADD `position` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `recipe_ingredients` ADD `position` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `recipe_ingredients` SET `position` = `rowid`;--> statement-breakpoint
UPDATE `event_recipes` SET `position` = `rowid`;
