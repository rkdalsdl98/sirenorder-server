/*
  Warnings:

  - You are about to drop the column `store_code` on the `store` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "store_store_code_key";

-- AlterTable
ALTER TABLE "store" DROP COLUMN "store_code";
