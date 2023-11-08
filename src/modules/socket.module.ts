import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtFactory } from "../common/jwt/jwtfactory";
import { SocketGateWay } from "../common/socket/socket.gateway";
import { MerchantRepository } from "../repositories/store/merchant.repository";
import { AuthService } from "../services/auth.service";
import { PrismaService } from "../services/prisma.service";
import { RedisService } from "src/services/redis.service";

@Module({
    providers: [
        SocketGateWay,
        MerchantRepository,
        AuthService,
        PrismaService,
        RedisService,
        JwtService,
        JwtFactory,
    ],
})
export class SocketModule {}