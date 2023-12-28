/*
  Warnings:

  - You are about to drop the column `price` on the `menu` table. All the data in the column will be lost.
  - You are about to drop the column `volume` on the `menu` table. All the data in the column will be lost.
  - Added the required column `volume` to the `menudetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "menu" DROP COLUMN "price",
DROP COLUMN "volume";

-- AlterTable
ALTER TABLE "menudetail" ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "volume" TEXT NOT NULL;
