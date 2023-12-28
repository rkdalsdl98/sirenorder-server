import { Module } from "@nestjs/common";
import { CouponController } from "src/controllers/coupon.controller";
import { CouponRepository } from "src/repositories/coupon/coupon.repository";
import { CouponService } from "src/services/coupon.service";
import { PrismaService } from "src/services/prisma.service";
import { RedisService } from "src/services/redis.service";
import { AuthModule } from "./auth.module";
import { JwtModule } from "./jwt.module";
import { SSEModule } from "./sse.module";

@Module({
    imports: [
        AuthModule,
        JwtModule,
        SSEModule,
    ],
    controllers: [CouponController],
    providers: [
        PrismaService,
        CouponRepository,
        RedisService,
        CouponService,
    ],
    exports: [
        CouponService,
        CouponRepository,
    ]
})
export class CouponModule {}