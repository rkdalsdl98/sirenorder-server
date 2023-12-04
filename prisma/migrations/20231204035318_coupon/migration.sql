/*
  Warnings:

  - Added the required column `salt` to the `coupon` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "coupon" ADD COLUMN     "salt" TEXT NOT NULL;
