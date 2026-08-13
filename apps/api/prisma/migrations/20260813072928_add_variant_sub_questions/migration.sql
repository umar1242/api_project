-- AlterTable
ALTER TABLE "variant_task_answers" ADD COLUMN     "sub_answers" JSONB;

-- CreateTable
CREATE TABLE "variant_sub_questions" (
    "id" BIGSERIAL NOT NULL,
    "task_id" BIGINT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "correct_answer" TEXT,

    CONSTRAINT "variant_sub_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "variant_sub_questions_task_id_idx" ON "variant_sub_questions"("task_id");

-- AddForeignKey
ALTER TABLE "variant_sub_questions" ADD CONSTRAINT "variant_sub_questions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "variant_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
