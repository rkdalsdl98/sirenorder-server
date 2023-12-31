import { Module } from "@nestjs/common";
import { StoreController } from "../controllers/store.controller";
import { MerchantRepository } from "../repositories/store/merchant.repository";
import { StoreRepository } from "../repositories/store/store.repository";
import { MerchantService } from "../services/merchant.service";
import { RedisService } from "../services/redis.service";
import { StoreService } from "../services/store.service";
import { ConfigService } from "@nestjs/config";
import { MerchantController } from "src/controllers/merchant.controller";
import { SocketModule } from "./socket.module";
import { JwtModule } from "./jwt.module";
import { AuthModule } from "./auth.module";
import { CouponModule } from "./coupon.module";
import { UserModule } from "./user.module";

@Module({
    imports: [
        SocketModule,
        JwtModule,
        AuthModule,
        CouponModule,
        UserModule,
    ],
    controllers: [
        StoreController,
        MerchantController,
    ],
    providers: [
        StoreService,
        StoreRepository,
        RedisService,
        ConfigService,
        MerchantRepository,
        MerchantService,
    ]
})
export class StoreModule {}