CREATE TABLE "historical_tasks" (
	"address" text PRIMARY KEY NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"description_hash" text DEFAULT '' NOT NULL,
	"creator" text NOT NULL,
	"task_index" text DEFAULT '' NOT NULL,
	"bounty_lamports" text DEFAULT '0' NOT NULL,
	"deadline" integer DEFAULT 0 NOT NULL,
	"final_status" text NOT NULL,
	"agent" text DEFAULT '' NOT NULL,
	"payout_lamports" text DEFAULT '0' NOT NULL,
	"fee_lamports" text DEFAULT '0' NOT NULL,
	"refunded_lamports" text DEFAULT '0' NOT NULL,
	"created_at" integer DEFAULT 0 NOT NULL,
	"closed_at" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "indexed_events" (
	"id" text PRIMARY KEY NOT NULL,
	"signature" text NOT NULL,
	"slot" integer NOT NULL,
	"block_time" integer NOT NULL,
	"event_name" text NOT NULL,
	"data" jsonb NOT NULL,
	"task_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_descriptions" (
	"description_hash" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"task_address" text,
	"creator" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_titles" (
	"task_address" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_hist_creator" ON "historical_tasks" USING btree ("creator");--> statement-breakpoint
CREATE INDEX "idx_hist_agent" ON "historical_tasks" USING btree ("agent");--> statement-breakpoint
CREATE INDEX "idx_hist_final_status" ON "historical_tasks" USING btree ("final_status");--> statement-breakpoint
CREATE INDEX "idx_hist_closed_at" ON "historical_tasks" USING btree ("closed_at");--> statement-breakpoint
CREATE INDEX "idx_events_task_address" ON "indexed_events" USING btree ("task_address");--> statement-breakpoint
CREATE INDEX "idx_events_event_name" ON "indexed_events" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "idx_events_block_time" ON "indexed_events" USING btree ("block_time");--> statement-breakpoint
CREATE INDEX "idx_events_signature" ON "indexed_events" USING btree ("signature");--> statement-breakpoint
CREATE INDEX "idx_desc_task_address" ON "task_descriptions" USING btree ("task_address");