/*
  Warnings:

  - You are about to drop the column `tokens` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "tokens",
ADD COLUMN     "accesstoken" TEXT,
ADD COLUMN     "refreshtoken" TEXT;
