/*
  Warnings:

  - You are about to drop the column `menuinfo` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `merchant_uid` on the `order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[store_uid]` on the table `order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `store_uid` to the `order` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "order_merchant_uid_key";

-- AlterTable
ALTER TABLE "order" DROP COLUMN "menuinfo",
DROP COLUMN "merchant_uid",
ADD COLUMN     "menus" JSONB[],
ADD COLUMN     "store_uid" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "order_store_uid_key" ON "order"("store_uid");
