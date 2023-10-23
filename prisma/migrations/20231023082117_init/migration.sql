-- CreateTable
CREATE TABLE "user" (
    "uuid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pass" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "coupons" TEXT[],
    "orderhistory" JSONB,
    "token" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "wallet" (
    "uuid" TEXT NOT NULL,
    "point" INTEGER NOT NULL DEFAULT 0,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "user_uid" TEXT NOT NULL,

    CONSTRAINT "wallet_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "gift" (
    "uuid" TEXT NOT NULL,
    "coupon" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "wrappingtype" TEXT NOT NULL DEFAULT 'default',
    "user_uid" TEXT NOT NULL,

    CONSTRAINT "gift_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "coupon" (
    "code" TEXT NOT NULL,
    "menuinfo" JSONB NOT NULL,
    "expirationperiod" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "order" (
    "uuid" TEXT NOT NULL,
    "saleprice" INTEGER NOT NULL DEFAULT 0,
    "totalprice" INTEGER NOT NULL DEFAULT 0,
    "merchant_uid" TEXT NOT NULL,
    "menuinfo" JSONB NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "linkedorder" (
    "user_uid" TEXT NOT NULL,
    "order_uid" TEXT NOT NULL,
    "store_uid" TEXT NOT NULL,

    CONSTRAINT "linkedorder_pkey" PRIMARY KEY ("user_uid","store_uid","order_uid")
);

-- CreateTable
CREATE TABLE "merchant" (
    "uuid" TEXT NOT NULL,
    "pass" TEXT NOT NULL,
    "salt" TEXT NOT NULL,

    CONSTRAINT "merchant_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "store" (
    "uuid" TEXT NOT NULL,
    "storename" TEXT NOT NULL,
    "thumbnail" TEXT,
    "location" JSONB NOT NULL,
    "address" TEXT NOT NULL,
    "owner_uid" TEXT NOT NULL,

    CONSTRAINT "store_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "storedetail" (
    "id" SERIAL NOT NULL,
    "decscription" TEXT,
    "images" TEXT[],
    "openhours" JSONB,
    "sirenorderhours" JSONB,
    "phonenumber" TEXT NOT NULL,
    "parkinginfo" TEXT NOT NULL,
    "waytocome" TEXT NOT NULL,
    "store_uid" TEXT NOT NULL,

    CONSTRAINT "storedetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storewallet" (
    "uuid" TEXT NOT NULL,
    "store_uid" TEXT NOT NULL,

    CONSTRAINT "storewallet_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" SERIAL NOT NULL,
    "amounts" INTEGER NOT NULL DEFAULT 0,
    "menuinfo" JSONB NOT NULL,
    "salesdate" TEXT NOT NULL,
    "wallet_uid" TEXT NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "en_name" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "thumbnail" TEXT NOT NULL,

    CONSTRAINT "menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menudetail" (
    "id" SERIAL NOT NULL,
    "size" TEXT NOT NULL DEFAULT 'Short',
    "description" TEXT,
    "allergys" TEXT[],
    "menu_id" INTEGER NOT NULL,

    CONSTRAINT "menudetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition" (
    "id" SERIAL NOT NULL,
    "size" TEXT NOT NULL,
    "calorie" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "carbohydrate" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "sugars" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "salt" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "protein" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "fat" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "cholesterol" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "transfat" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "saturatedfat" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "caffeine" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "detail_id" INTEGER NOT NULL,

    CONSTRAINT "nutrition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_user_uid_key" ON "wallet"("user_uid");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_code_key" ON "coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "order_merchant_uid_key" ON "order"("merchant_uid");

-- CreateIndex
CREATE UNIQUE INDEX "linkedorder_user_uid_key" ON "linkedorder"("user_uid");

-- CreateIndex
CREATE UNIQUE INDEX "linkedorder_order_uid_key" ON "linkedorder"("order_uid");

-- CreateIndex
CREATE UNIQUE INDEX "linkedorder_store_uid_key" ON "linkedorder"("store_uid");

-- CreateIndex
CREATE UNIQUE INDEX "store_owner_uid_key" ON "store"("owner_uid");

-- CreateIndex
CREATE UNIQUE INDEX "storedetail_store_uid_key" ON "storedetail"("store_uid");

-- CreateIndex
CREATE UNIQUE INDEX "storewallet_store_uid_key" ON "storewallet"("store_uid");

-- CreateIndex
CREATE UNIQUE INDEX "sales_wallet_uid_key" ON "sales"("wallet_uid");

-- CreateIndex
CREATE UNIQUE INDEX "menudetail_menu_id_key" ON "menudetail"("menu_id");

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "user"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift" ADD CONSTRAINT "gift_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "user"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linkedorder" ADD CONSTRAINT "linkedorder_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "user"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "linkedorder" ADD CONSTRAINT "linkedorder_order_uid_fkey" FOREIGN KEY ("order_uid") REFERENCES "order"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linkedorder" ADD CONSTRAINT "linkedorder_store_uid_fkey" FOREIGN KEY ("store_uid") REFERENCES "store"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store" ADD CONSTRAINT "store_owner_uid_fkey" FOREIGN KEY ("owner_uid") REFERENCES "merchant"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storedetail" ADD CONSTRAINT "storedetail_store_uid_fkey" FOREIGN KEY ("store_uid") REFERENCES "store"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storewallet" ADD CONSTRAINT "storewallet_store_uid_fkey" FOREIGN KEY ("store_uid") REFERENCES "store"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_wallet_uid_fkey" FOREIGN KEY ("wallet_uid") REFERENCES "storewallet"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menudetail" ADD CONSTRAINT "menudetail_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition" ADD CONSTRAINT "nutrition_detail_id_fkey" FOREIGN KEY ("detail_id") REFERENCES "menudetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
