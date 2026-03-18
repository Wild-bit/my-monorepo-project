-- AlterTable
ALTER TABLE "i18n_project_schema"."operation_logs" ADD COLUMN     "project_id" TEXT;

-- CreateIndex
CREATE INDEX "operation_logs_project_id_idx" ON "i18n_project_schema"."operation_logs"("project_id");

-- AddForeignKey
ALTER TABLE "i18n_project_schema"."operation_logs" ADD CONSTRAINT "operation_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "i18n_project_schema"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
