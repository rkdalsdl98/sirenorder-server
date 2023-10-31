-- DropForeignKey
ALTER TABLE "gift" DROP CONSTRAINT "gift_user_email_fkey";

-- DropForeignKey
ALTER TABLE "menudetail" DROP CONSTRAINT "menudetail_menu_id_fkey";

-- DropForeignKey
ALTER TABLE "nutrition" DROP CONSTRAINT "nutrition_detail_id_fkey";

-- DropForeignKey
ALTER TABLE "sales" DROP CONSTRAINT "sales_wallet_uid_fkey";

-- DropForeignKey
ALTER TABLE "store" DROP CONSTRAINT "store_owner_uid_fkey";

-- DropForeignKey
ALTER TABLE "storedetail" DROP CONSTRAINT "storedetail_store_uid_fkey";

-- DropForeignKey
ALTER TABLE "storewallet" DROP CONSTRAINT "storewallet_store_uid_fkey";

-- DropForeignKey
ALTER TABLE "wallet" DROP CONSTRAINT "wallet_user_uid_fkey";

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift" ADD CONSTRAINT "gift_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "user"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store" ADD CONSTRAINT "store_owner_uid_fkey" FOREIGN KEY ("owner_uid") REFERENCES "merchant"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storedetail" ADD CONSTRAINT "storedetail_store_uid_fkey" FOREIGN KEY ("store_uid") REFERENCES "store"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storewallet" ADD CONSTRAINT "storewallet_store_uid_fkey" FOREIGN KEY ("store_uid") REFERENCES "store"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_wallet_uid_fkey" FOREIGN KEY ("wallet_uid") REFERENCES "storewallet"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menudetail" ADD CONSTRAINT "menudetail_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition" ADD CONSTRAINT "nutrition_detail_id_fkey" FOREIGN KEY ("detail_id") REFERENCES "menudetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
