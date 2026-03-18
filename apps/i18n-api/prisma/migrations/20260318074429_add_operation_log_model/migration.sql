-- CreateEnum
CREATE TYPE "i18n_project_schema"."OperationType" AS ENUM ('CREATE_PROJECT', 'UPDATE_PROJECT', 'CREATE_KEY', 'UPDATE_KEY', 'DELETE_KEY', 'CREATE_TRANSLATION', 'UPDATE_TRANSLATION', 'DELETE_TRANSLATION');

-- CreateTable
CREATE TABLE "i18n_project_schema"."operation_logs" (
    "id" TEXT NOT NULL,
    "operation_type" "i18n_project_schema"."OperationType" NOT NULL,
    "operator_id" TEXT NOT NULL,
    "operation_content" TEXT NOT NULL,
    "operation_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "operation_logs_operator_id_idx" ON "i18n_project_schema"."operation_logs"("operator_id");

-- AddForeignKey
ALTER TABLE "i18n_project_schema"."operation_logs" ADD CONSTRAINT "operation_logs_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "i18n_project_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
