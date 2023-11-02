/*
  Warnings:

  - You are about to drop the column `decscription` on the `storedetail` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "storedetail" DROP COLUMN "decscription",
ADD COLUMN     "description" TEXT;
