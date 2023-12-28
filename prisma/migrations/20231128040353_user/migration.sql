-- AlterTable
ALTER TABLE "menu" ALTER COLUMN "category" SET DEFAULT 'notdefined';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "tel" TEXT NOT NULL DEFAULT '000-0000-0000';
