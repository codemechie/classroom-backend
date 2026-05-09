ALTER TABLE "subjects" DROP CONSTRAINT "subjects_name_unique";--> statement-breakpoint
CREATE INDEX "idx_subjects_department_id" ON "subjects" USING btree ("department_id");--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "uq_subjects_department_name" UNIQUE("department_id","name");