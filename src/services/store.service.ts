import { Injectable, Logger } from "@nestjs/common";
import { OrderDto, StoreDetailDto, StoreDto } from "../dto/store.dto";
import { StoreRepository } from "../repositories/store/store.repository";
import { RedisService } from "./redis.service";
import { StoreEntity } from "src/repositories/store/store.entity";

@Injectable()
export class StoreService {
    constructor(
        private readonly storeRepository: StoreRepository,
        private readonly redis: RedisService,
    ){
        this._initialized()
    }

    private async _initialized() :
    Promise<void> {
        const stores = await this.storeRepository.getMany()
        await this.redis.set("stores", stores, StoreService.name)
        .then(_=> Logger.log("상점정보 인 메모리 캐싱"))
        .catch(err => {
            Logger.error("상점정보 인 메모리 캐싱실패")
            throw err
        })
    }

    async getStoreDetailBy(id: number) : 
    Promise<StoreDetailDto> {
        return (await this.storeRepository.getBy(id)
        .then(s => ({ ...s } as StoreDetailDto))
        .catch(err => {
            Logger.error("상점 상세정보 조회 실패", err) 
            throw err
        }))
    }

    async getOrders(storeId: string) :
    Promise<OrderDto[]> {
        return (await this.storeRepository.getOrders(storeId)
        .then(o => o.map(od => ({ ...od } as OrderDto)))
        .catch(err => {
            Logger.error("상점 상세정보 조회 실패", err) 
            throw err
        }))
    }

    async getStores() :
    Promise<StoreDto[]> {
        return await this._getStores()
    }

    /**
     * 유저정보조회
     * 
     * 캐시된 데이터가 있다면 캐시 데이터를 반환
     * @param email 
     * @returns User
     */
    private async _getStores() :
    Promise<StoreDto[]> {
        const caches = (await this.redis.get<StoreEntity[]>("stores", StoreService.name)
        .catch(err => {
            Logger.error("캐시로드오류")
            throw err
        }))

        if(caches !== null) {
            return caches.map(s => ({ 
                address: s.address,
                location: s.location,
                thumbnail: s.thumbnail,
                detail: s.detail,
             } as StoreDto))
        }
        return (await this.storeRepository.getMany().catch(err => {
            Logger.error("상점 리스트 조회 실패", err) 
            throw err
        })).map(s => ({ 
            address: s.address,
            location: s.location,
            thumbnail: s.thumbnail,
            detail: s.detail,
         } as StoreDto))
    }
}