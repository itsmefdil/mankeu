ALTER TABLE "monthly_budgets" ADD COLUMN "period_type" text DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_budgets" ADD COLUMN "start_month" integer;--> statement-breakpoint
ALTER TABLE "monthly_budgets" ADD COLUMN "start_year" integer;--> statement-breakpoint
ALTER TABLE "monthly_budgets" ADD COLUMN "end_month" integer;--> statement-breakpoint
ALTER TABLE "monthly_budgets" ADD COLUMN "end_year" integer;