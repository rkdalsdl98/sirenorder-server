import { CacheModule } from "@nestjs/cache-manager";
import * as redisStore from 'cache-manager-ioredis';
import { Module } from "@nestjs/common";
import { RedisService } from "src/services/redis.service";
import * as dotenv from "dotenv"
dotenv.config()

@Module({
    imports: [
        CacheModule.register({
            store: redisStore,
            host: process.env.SERVER_IP_DEV,
            port: process.env.REDIS_PORT,
            ttl: 60,
            isGlobal: true,
        })
    ],
    providers: [
        RedisService,
    ],
    exports: [RedisService],
})
export class RedisModule {}