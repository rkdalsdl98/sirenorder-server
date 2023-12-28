/*
  Warnings:

  - The `deliveryinfo` column on the `order` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "order" DROP COLUMN "deliveryinfo",
ADD COLUMN     "deliveryinfo" JSONB[];
