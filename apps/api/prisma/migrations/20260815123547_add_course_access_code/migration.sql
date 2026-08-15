/*
  Warnings:

  - A unique constraint covering the columns `[access_code]` on the table `courses` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "access_code" VARCHAR(5);

-- CreateIndex
CREATE UNIQUE INDEX "courses_access_code_key" ON "courses"("access_code");
