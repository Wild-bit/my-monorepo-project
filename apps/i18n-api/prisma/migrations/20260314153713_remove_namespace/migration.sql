/*
  Warnings:

  - You are about to drop the column `namespace` on the `i18n_keys` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[project_id,key]` on the table `i18n_keys` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "i18n_project_schema"."i18n_keys_project_id_namespace_key_key";

-- AlterTable
ALTER TABLE "i18n_project_schema"."i18n_keys" DROP COLUMN "namespace";

-- CreateIndex
CREATE UNIQUE INDEX "i18n_keys_project_id_key_key" ON "i18n_project_schema"."i18n_keys"("project_id", "key");
