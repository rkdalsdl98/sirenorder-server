/*
  Warnings:

  - You are about to drop the `linkedorder` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "linkedorder" DROP CONSTRAINT "linkedorder_order_uid_fkey";

-- DropForeignKey
ALTER TABLE "linkedorder" DROP CONSTRAINT "linkedorder_store_uid_fkey";

-- DropForeignKey
ALTER TABLE "linkedorder" DROP CONSTRAINT "linkedorder_user_uid_fkey";

-- DropTable
DROP TABLE "linkedorder";
