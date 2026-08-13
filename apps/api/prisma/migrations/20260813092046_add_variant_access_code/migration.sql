/*
  Warnings:

  - A unique constraint covering the columns `[access_code]` on the table `variants` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "variants" ADD COLUMN     "access_code" VARCHAR(5);

-- CreateIndex
CREATE UNIQUE INDEX "variants_access_code_key" ON "variants"("access_code");
