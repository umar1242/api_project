-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('MULTIPLE_CHOICE', 'SPECIFIC_ANSWER', 'WRITTEN_WORK');

-- CreateEnum
CREATE TYPE "VariantType" AS ENUM ('CERTIFICATION', 'HOMEWORK');

-- CreateTable
CREATE TABLE "variants" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "VariantType" NOT NULL DEFAULT 'CERTIFICATION',
    "file_url" VARCHAR(500),
    "deadline_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "course_id" BIGINT,
    "group_id" BIGINT,

    CONSTRAINT "variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_tasks" (
    "id" BIGSERIAL NOT NULL,
    "variant_id" BIGINT NOT NULL,
    "type" "TaskType" NOT NULL,
    "order_index" INTEGER NOT NULL,
    "requires_admin" BOOLEAN NOT NULL DEFAULT false,
    "options_count" INTEGER,
    "correct_answer" TEXT,

    CONSTRAINT "variant_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_submissions" (
    "id" BIGSERIAL NOT NULL,
    "variant_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "total_score" INTEGER,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "variant_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_task_answers" (
    "id" BIGSERIAL NOT NULL,
    "submission_id" BIGINT NOT NULL,
    "task_id" BIGINT NOT NULL,
    "answer" TEXT,
    "file_url" VARCHAR(500),
    "score" INTEGER,
    "feedback" TEXT,

    CONSTRAINT "variant_task_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "variants_course_id_idx" ON "variants"("course_id");

-- CreateIndex
CREATE INDEX "variants_group_id_idx" ON "variants"("group_id");

-- CreateIndex
CREATE INDEX "variant_tasks_variant_id_idx" ON "variant_tasks"("variant_id");

-- CreateIndex
CREATE INDEX "variant_submissions_user_id_idx" ON "variant_submissions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "variant_submissions_variant_id_user_id_key" ON "variant_submissions"("variant_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "variant_task_answers_submission_id_task_id_key" ON "variant_task_answers"("submission_id", "task_id");

-- AddForeignKey
ALTER TABLE "variants" ADD CONSTRAINT "variants_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variants" ADD CONSTRAINT "variants_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_tasks" ADD CONSTRAINT "variant_tasks_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_submissions" ADD CONSTRAINT "variant_submissions_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_submissions" ADD CONSTRAINT "variant_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_task_answers" ADD CONSTRAINT "variant_task_answers_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "variant_submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_task_answers" ADD CONSTRAINT "variant_task_answers_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "variant_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
