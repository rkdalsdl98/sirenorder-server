/*
  Warnings:

  - You are about to drop the column `volume` on the `menudetail` table. All the data in the column will be lost.
  - Added the required column `volume` to the `nutrition` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "menudetail" DROP COLUMN "volume";

-- AlterTable
ALTER TABLE "nutrition" ADD COLUMN     "volume" TEXT NOT NULL;
