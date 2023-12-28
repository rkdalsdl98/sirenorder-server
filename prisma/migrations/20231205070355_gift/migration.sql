/*
  Warnings:

  - Added the required column `imp_uid` to the `gift` table without a default value. This is not possible if the table is not empty.
  - Added the required column `menu` to the `gift` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order_uid` to the `gift` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "gift" ADD COLUMN     "imp_uid" TEXT NOT NULL,
ADD COLUMN     "menu" JSONB NOT NULL,
ADD COLUMN     "order_uid" TEXT NOT NULL;
