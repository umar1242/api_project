/*
  Warnings:

  - You are about to drop the column `file_url` on the `variant_task_answers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "variant_task_answers" DROP COLUMN "file_url",
ADD COLUMN     "file_urls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "variant_tasks" ADD COLUMN     "max_attachments" INTEGER DEFAULT 4,
ADD COLUMN     "requires_attachment" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "variants" ADD COLUMN     "starts_at" TIMESTAMPTZ;
