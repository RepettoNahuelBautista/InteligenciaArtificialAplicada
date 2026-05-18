-- AlterTable: add optional personal info fields to user_profiles
ALTER TABLE "user_profiles" ADD COLUMN "displayName" TEXT;
ALTER TABLE "user_profiles" ADD COLUMN "birthDate" TIMESTAMP(3);
ALTER TABLE "user_profiles" ADD COLUMN "country" TEXT;
ALTER TABLE "user_profiles" ADD COLUMN "language" TEXT;
