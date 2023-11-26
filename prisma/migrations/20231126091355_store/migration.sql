/*
  Warnings:

  - Added the required column `imp_uid` to the `merchant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "merchant" ADD COLUMN     "imp_uid" TEXT NOT NULL;
