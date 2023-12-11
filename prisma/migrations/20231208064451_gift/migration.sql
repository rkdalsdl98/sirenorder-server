/*
  Warnings:

  - Added the required column `message` to the `gift` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "gift" ADD COLUMN     "message" TEXT NOT NULL;
