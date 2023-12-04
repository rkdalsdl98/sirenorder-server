import { Module } from "@nestjs/common";
import { SocketGateWay } from "../common/socket/socket.gateway";
import { MerchantRepository } from "../repositories/store/merchant.repository";
import { PrismaService } from "../services/prisma.service";
import { RedisService } from "src/services/redis.service";
import { StoreRepository } from "src/repositories/store/store.repository";
import { JwtModule } from "./jwt.module";
import { AuthModule } from "./auth.module";

@Module({
    imports: [
        JwtModule,
        AuthModule
    ],
    providers: [
        SocketGateWay,
        MerchantRepository,
        StoreRepository,
        PrismaService,
        RedisService,
    ],
    exports: [SocketGateWay]
})
export class SocketModule {}