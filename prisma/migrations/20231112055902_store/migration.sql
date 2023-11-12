/*
  Warnings:

  - Added the required column `deliveryinfo` to the `order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order" ADD COLUMN     "deliveryinfo" JSONB NOT NULL;
