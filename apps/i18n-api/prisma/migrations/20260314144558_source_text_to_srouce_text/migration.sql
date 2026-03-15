/*
  Warnings:

  - You are about to drop the column `sourceText` on the `i18n_keys` table. All the data in the column will be lost.
  - Added the required column `source_text` to the `i18n_keys` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "i18n_project_schema"."i18n_keys" DROP COLUMN "sourceText",
ADD COLUMN     "source_text" TEXT NOT NULL;
