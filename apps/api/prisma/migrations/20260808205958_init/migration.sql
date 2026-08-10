-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('ONLINE', 'RECORDED');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('PENDING', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'GRADED', 'RETURNED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EARNED', 'SPENT', 'PENALTY');

-- CreateEnum
CREATE TYPE "ShopItemStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'FULFILLED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "groups" DROP CONSTRAINT "groups_course_id_fkey";

-- AlterTable
ALTER TABLE "groups" ALTER COLUMN "course_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "lessons" (
    "id" BIGSERIAL NOT NULL,
    "group_id" BIGINT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "LessonType" NOT NULL DEFAULT 'ONLINE',
    "status" "LessonStatus" NOT NULL DEFAULT 'SCHEDULED',
    "starts_at" TIMESTAMPTZ NOT NULL,
    "duration_min" INTEGER NOT NULL DEFAULT 60,
    "meeting_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" BIGSERIAL NOT NULL,
    "lesson_id" BIGINT,
    "group_id" BIGINT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "file_url" VARCHAR(500),
    "telegram_file_id" VARCHAR(255),
    "status" "MaterialStatus" NOT NULL DEFAULT 'PENDING',
    "publish_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" BIGSERIAL NOT NULL,
    "group_id" BIGINT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'DRAFT',
    "publish_at" TIMESTAMPTZ,
    "deadline_at" TIMESTAMPTZ,
    "file_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "lesson_id" BIGINT,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_submissions" (
    "id" BIGSERIAL NOT NULL,
    "assignment_id" BIGINT NOT NULL,
    "enrollment_id" BIGINT NOT NULL,
    "file_url" VARCHAR(500),
    "content" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "grade" INTEGER,
    "feedback" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gamification_configs" (
    "id" BIGSERIAL NOT NULL,
    "course_id" BIGINT NOT NULL,
    "attendance_reward" INTEGER NOT NULL DEFAULT 10,
    "homework_reward" INTEGER NOT NULL DEFAULT 20,
    "perfect_test_reward" INTEGER NOT NULL DEFAULT 50,
    "late_penalty" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "gamification_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_stats" (
    "id" BIGSERIAL NOT NULL,
    "enrollment_id" BIGINT NOT NULL,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "highest_streak" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "student_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_transactions" (
    "id" BIGSERIAL NOT NULL,
    "stats_id" BIGINT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coin_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_shop_items" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "cost" INTEGER NOT NULL,
    "stock" INTEGER,
    "status" "ShopItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "coin_shop_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_shop_purchases" (
    "id" BIGSERIAL NOT NULL,
    "item_id" BIGINT NOT NULL,
    "enrollment_id" BIGINT NOT NULL,
    "cost" INTEGER NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "coin_shop_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "admin_id" BIGINT NOT NULL,
    "action" VARCHAR(255) NOT NULL,
    "entity_id" BIGINT,
    "entity_type" VARCHAR(100),
    "details" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lessons_group_id_idx" ON "lessons"("group_id");

-- CreateIndex
CREATE INDEX "lessons_starts_at_idx" ON "lessons"("starts_at");

-- CreateIndex
CREATE INDEX "lessons_status_idx" ON "lessons"("status");

-- CreateIndex
CREATE INDEX "materials_lesson_id_idx" ON "materials"("lesson_id");

-- CreateIndex
CREATE INDEX "materials_group_id_idx" ON "materials"("group_id");

-- CreateIndex
CREATE INDEX "materials_status_publish_at_idx" ON "materials"("status", "publish_at");

-- CreateIndex
CREATE INDEX "assignments_group_id_idx" ON "assignments"("group_id");

-- CreateIndex
CREATE INDEX "assignments_status_idx" ON "assignments"("status");

-- CreateIndex
CREATE INDEX "assignments_deadline_at_idx" ON "assignments"("deadline_at");

-- CreateIndex
CREATE INDEX "assignment_submissions_assignment_id_idx" ON "assignment_submissions"("assignment_id");

-- CreateIndex
CREATE INDEX "assignment_submissions_enrollment_id_idx" ON "assignment_submissions"("enrollment_id");

-- CreateIndex
CREATE INDEX "assignment_submissions_status_idx" ON "assignment_submissions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_submissions_assignment_id_enrollment_id_key" ON "assignment_submissions"("assignment_id", "enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "gamification_configs_course_id_key" ON "gamification_configs"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_stats_enrollment_id_key" ON "student_stats"("enrollment_id");

-- CreateIndex
CREATE INDEX "coin_transactions_stats_id_idx" ON "coin_transactions"("stats_id");

-- CreateIndex
CREATE INDEX "coin_transactions_type_idx" ON "coin_transactions"("type");

-- CreateIndex
CREATE INDEX "coin_shop_purchases_item_id_idx" ON "coin_shop_purchases"("item_id");

-- CreateIndex
CREATE INDEX "coin_shop_purchases_enrollment_id_idx" ON "coin_shop_purchases"("enrollment_id");

-- CreateIndex
CREATE INDEX "audit_logs_admin_id_idx" ON "audit_logs"("admin_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gamification_configs" ADD CONSTRAINT "gamification_configs_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_stats" ADD CONSTRAINT "student_stats_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_stats_id_fkey" FOREIGN KEY ("stats_id") REFERENCES "student_stats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_shop_purchases" ADD CONSTRAINT "coin_shop_purchases_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "coin_shop_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_shop_purchases" ADD CONSTRAINT "coin_shop_purchases_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
