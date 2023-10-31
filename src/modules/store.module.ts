import { Module } from "@nestjs/common";
import { StoreController } from "src/controllers/store.controller";
import { StoreRepository } from "src/repositories/store/store.repository";
import { PrismaService } from "src/services/prisma.service";
import { RedisService } from "src/services/redis.service";
import { StoreService } from "src/services/store.service";

@Module({
    controllers: [StoreController],
    providers: [
        StoreService,
        StoreRepository,
        RedisService,
        PrismaService,
    ]
})
export class StoreModule {}