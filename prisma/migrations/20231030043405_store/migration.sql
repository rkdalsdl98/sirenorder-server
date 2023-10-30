/*
  Warnings:

  - A unique constraint covering the columns `[store_code]` on the table `store` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "store" ADD COLUMN     "store_code" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "store_store_code_key" ON "store"("store_code");
