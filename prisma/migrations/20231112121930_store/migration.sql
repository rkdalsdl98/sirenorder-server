/*
  Warnings:

  - You are about to drop the column `menuinfo` on the `sales` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sales" DROP COLUMN "menuinfo",
ADD COLUMN     "menus" JSONB[];
