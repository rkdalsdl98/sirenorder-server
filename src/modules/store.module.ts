import { Module } from "@nestjs/common";
import { StoreController } from "../controllers/store.controller";
import { MerchantRepository } from "../repositories/store/merchant.repository";
import { StoreRepository } from "../repositories/store/store.repository";
import { MerchantService } from "../services/merchant.service";
import { PrismaService } from "../services/prisma.service";
import { RedisService } from "../services/redis.service";
import { StoreService } from "../services/store.service";
import { JwtService } from "@nestjs/jwt";
import { JwtFactory } from "../common/jwt/jwtfactory";
import { AuthService } from "../services/auth.service";
import { ConfigService } from "@nestjs/config";
import { SocketGateWay } from "src/common/socket/socket.gateway";

@Module({
    controllers: [
        StoreController
    ],
    providers: [
        StoreService,
        StoreRepository,
        RedisService,
        PrismaService,
        JwtService,
        JwtFactory,
        AuthService,
        ConfigService,
        MerchantRepository,
        MerchantService,
    ],
    exports: [MerchantRepository]
})
export class StoreModule {}