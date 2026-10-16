/*
  Warnings:

  - You are about to drop the column `metadata` on the `faqs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."audit_logs" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "public"."faqs" DROP COLUMN "metadata";
