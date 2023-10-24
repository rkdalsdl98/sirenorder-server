/*
  Warnings:

  - You are about to drop the column `user_uid` on the `gift` table. All the data in the column will be lost.
  - The `orderhistory` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `user_email` to the `gift` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "gift" DROP CONSTRAINT "gift_user_uid_fkey";

-- AlterTable
ALTER TABLE "gift" DROP COLUMN "user_uid",
ADD COLUMN     "user_email" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "orderhistory",
ADD COLUMN     "orderhistory" JSONB[];

-- AddForeignKey
ALTER TABLE "gift" ADD CONSTRAINT "gift_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "user"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
