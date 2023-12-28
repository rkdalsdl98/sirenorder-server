/*
  Warnings:

  - You are about to drop the column `imp_uid` on the `merchant` table. All the data in the column will be lost.
  - Added the required column `imp_uid` to the `store` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "merchant" DROP COLUMN "imp_uid";

-- AlterTable
ALTER TABLE "store" ADD COLUMN     "imp_uid" TEXT NOT NULL;
