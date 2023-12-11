/*
  Warnings:

  - Changed the type of `coupon` on the `gift` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "gift" DROP COLUMN "coupon",
ADD COLUMN     "coupon" JSONB NOT NULL;
