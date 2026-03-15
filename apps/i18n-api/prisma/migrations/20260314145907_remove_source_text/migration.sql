/*
  Warnings:

  - You are about to drop the column `source_text` on the `i18n_keys` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "i18n_project_schema"."i18n_keys" DROP COLUMN "source_text";
