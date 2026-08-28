ALTER TABLE "workflow_edges" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workflow_nodes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "workflow_edges" CASCADE;--> statement-breakpoint
DROP TABLE "workflow_nodes" CASCADE;--> statement-breakpoint
DROP INDEX "workflows_org_id_idx";--> statement-breakpoint
DROP INDEX "workflows_org_name_idx";--> statement-breakpoint
ALTER TABLE "workflows" ALTER COLUMN "org_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workflows" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "workflows" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "workflows" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "workflows" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "graph" jsonb;--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN "data";--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN "created_by_id";