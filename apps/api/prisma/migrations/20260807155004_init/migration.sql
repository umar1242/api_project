-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'CURATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PAUSED', 'BANNED');

-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'EXCLUDED', 'COMPLETED');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "telegram_id" BIGINT NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(30),
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "type" "CourseType" NOT NULL DEFAULT 'FREE',
    "description" TEXT,
    "plan" TEXT,
    "ref_link" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" BIGSERIAL NOT NULL,
    "course_id" BIGINT NOT NULL,
    "telegram_chat_id" BIGINT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "group_id" BIGINT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "payment_due_at" TIMESTAMPTZ,
    "payment_paid_at" TIMESTAMPTZ,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

-- CreateIndex
CREATE INDEX "users_telegram_id_idx" ON "users"("telegram_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "courses_ref_link_key" ON "courses"("ref_link");

-- CreateIndex
CREATE INDEX "courses_ref_link_idx" ON "courses"("ref_link");

-- CreateIndex
CREATE UNIQUE INDEX "groups_telegram_chat_id_key" ON "groups"("telegram_chat_id");

-- CreateIndex
CREATE INDEX "groups_course_id_idx" ON "groups"("course_id");

-- CreateIndex
CREATE INDEX "groups_telegram_chat_id_idx" ON "groups"("telegram_chat_id");

-- CreateIndex
CREATE INDEX "enrollments_user_id_idx" ON "enrollments"("user_id");

-- CreateIndex
CREATE INDEX "enrollments_group_id_idx" ON "enrollments"("group_id");

-- CreateIndex
CREATE INDEX "enrollments_status_idx" ON "enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_user_id_group_id_key" ON "enrollments"("user_id", "group_id");

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
