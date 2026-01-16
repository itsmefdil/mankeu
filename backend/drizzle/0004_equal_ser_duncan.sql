CREATE TYPE "public"."saving_transaction_type" AS ENUM('deposit', 'withdraw');--> statement-breakpoint
CREATE TABLE "saving_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"saving_id" integer NOT NULL,
	"type" "saving_transaction_type" NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"notes" text,
	"transaction_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "saving_transactions" ADD CONSTRAINT "saving_transactions_saving_id_savings_id_fk" FOREIGN KEY ("saving_id") REFERENCES "public"."savings"("id") ON DELETE no action ON UPDATE no action;