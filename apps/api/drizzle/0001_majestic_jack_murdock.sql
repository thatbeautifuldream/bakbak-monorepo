CREATE TABLE "analytics_event" (
	"id" uuid PRIMARY KEY NOT NULL,
	"installation_hash" text NOT NULL,
	"visit_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"domain" text NOT NULL,
	"category" text NOT NULL,
	"language" text NOT NULL,
	"browser" text NOT NULL,
	"country_code" text,
	"region_code" text,
	"active_seconds" integer DEFAULT 0 NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "analytics_event_occurred_at_idx" ON "analytics_event" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_event_installation_occurred_at_idx" ON "analytics_event" USING btree ("installation_hash","occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_event_domain_occurred_at_idx" ON "analytics_event" USING btree ("domain","occurred_at");