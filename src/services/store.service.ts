import { Injectable } from "@nestjs/common";
import { StoreRepository } from "src/repositories/store/store.repository";
import { RedisService } from "./redis.service";

@Injectable()
export class StoreService {
    constructor(
        private readonly storeRepository: StoreRepository,
        private readonly redis: RedisService,
    ){}
}