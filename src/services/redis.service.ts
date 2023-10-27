import { Inject, Injectable, Logger } from "@nestjs/common";
import { CACHE_MANAGER } from '@nestjs/cache-manager/dist';
import { Cache } from 'cache-manager';
import { ERROR } from "../common/type/response.type";

@Injectable()
export class RedisService {
    constructor(
        @Inject(CACHE_MANAGER)
        private readonly redisClient: Cache
    ){}

    async get<T>(key : string, path: string) : Promise<T | null>{
        return await this.redisClient.get(key)
        .catch(e => {
            Logger.error("레디스 캐시 정보 가져오기 실패", e.toString(), path)
            throw typeof ERROR.ServerCacheError
        }) as T
    }

    async set(key : string, value : unknown, path: string, ttl? : number | undefined) : Promise<void> {
        await this.redisClient.set(key, value, ttl)
        .catch(e => {
            Logger.error("레디스 캐시 정보 업데이트 실패", e.toString(), path)
            throw typeof ERROR.ServerCacheError
        })
    }

    async delete(key: string, path: string) : Promise<void> {
        await this.redisClient.del(key)
        .catch(e => {
            Logger.error("레디스 캐시 삭제 실패", e.toString(), path)
            throw typeof ERROR.ServerCacheError
        })
    }

    async reset(path: string) : Promise<void> {
        await this.redisClient.reset()
        .catch(e => {
            Logger.error("레디스 캐시 리셋 실패", e.toString(), path)
            throw typeof ERROR.ServerCacheError
        })
    }
}