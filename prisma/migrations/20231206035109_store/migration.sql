/*
  Warnings:

  - The `salesdate` column on the `sales` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "sales" DROP COLUMN "salesdate",
ADD COLUMN     "salesdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
