import { CacheModule } from "@nestjs/cache-manager";
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-ioredis';
import { Module } from "@nestjs/common";
import { RedisService } from "src/services/redis.service";

@Module({
    imports: [
        CacheModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              store: redisStore,
              host: config.get<string>("SERVER_IP_DEV"),
              port: config.get<number>("REDIS_PORT"),
              ttl: config.get<number>("REDIS_TTL"),
              isGlobal: true,
            })
        }),
    ],
    providers: [RedisService],
    exports: [RedisService],
})
export class RedisModule {}