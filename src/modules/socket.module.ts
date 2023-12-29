import { Module } from "@nestjs/common";
import { SocketGateWay } from "../common/socket/socket.gateway";
import { MerchantRepository } from "../repositories/store/merchant.repository";
import { RedisService } from "src/services/redis.service";
import { StoreRepository } from "src/repositories/store/store.repository";
import { JwtModule } from "./jwt.module";
import { AuthModule } from "./auth.module";
import { SSEModule } from "./sse.module";

@Module({
    imports: [
        JwtModule,
        AuthModule,
        SSEModule,
    ],
    providers: [
        SocketGateWay,
        MerchantRepository,
        StoreRepository,
        RedisService,
    ],
    exports: [SocketGateWay]
})
export class SocketModule {}