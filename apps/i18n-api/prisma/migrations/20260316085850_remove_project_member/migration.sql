/*
  Warnings:

  - You are about to drop the `project_members` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "i18n_project_schema"."project_members" DROP CONSTRAINT "project_members_project_id_fkey";

-- DropForeignKey
ALTER TABLE "i18n_project_schema"."project_members" DROP CONSTRAINT "project_members_user_id_fkey";

-- DropTable
DROP TABLE "i18n_project_schema"."project_members";

-- DropEnum
DROP TYPE "i18n_project_schema"."ProjectRole";
