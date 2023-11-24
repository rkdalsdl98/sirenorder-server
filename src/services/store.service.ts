import { Injectable, Logger } from "@nestjs/common";
import { StoreDetailDto, StoreDto } from "../dto/store.dto";
import { StoreRepository } from "../repositories/store/store.repository";
import { RedisService } from "./redis.service";
import { StoreEntity } from "src/repositories/store/store.entity";
import { RoomJoinOptions } from "src/common/type/socket.type";
import { SocketGateWay } from "src/common/socket/socket.gateway";
import { OrderEntity } from "src/repositories/user/order.entity";
import { AuthService } from "./auth.service";
import { OrderDto } from "src/dto/user.dto";

@Injectable()
export class StoreService {
    constructor(
        private readonly storeRepository: StoreRepository,
        private readonly redis: RedisService,
        private readonly socket: SocketGateWay,
        private readonly auth: AuthService,
    ){
        this._initialized()
    }

    private async _initialized() :
    Promise<void> {
        await this.storeRepository.deleteOrders()
        const stores = (await this.storeRepository.getMany())
        .map(s => ({ ...s, storeId: s.uuid, isOpen: false } as RoomJoinOptions))
        await this.redis.set("stores", stores, StoreService.name)
        .then(_=> Logger.log("상점정보 인 메모리 캐싱"))
        .catch(err => {
            Logger.error("상점정보 인 메모리 캐싱실패")
            throw err
        })
    }

    async sendOrder(order: OrderDto)
    : Promise<{ orderId: string | null, result: boolean }> {
        const store = (await this.redis.get<RoomJoinOptions[]>("stores", StoreService.name))
        ?.find(s => s.storeId === order.store_uid)
        if(store && store.isOpen && store.socketId) {
            const orderId = this.auth.getRandUUID()
            const create = await this.storeRepository.createOrder({
                ...order,
                uuid: orderId,
            })
            .catch(err => {
                Logger.error("주문 생성 실패", err) 
                throw err
            })

            const result = this.socket.sendOrder(store.socketId, create)
            if(result) {
                await this.redis.set(orderId, "wait", StoreService.name)
                return {
                    orderId,
                    result,
                }
            } else {
                await this.storeRepository.deleteOrder(orderId)
                return {
                    orderId: null,
                    result,
                }
            }
        }

        return {
            orderId: null,
            result: false,
        }
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
    Promise<OrderEntity[]> {
        return (await this.storeRepository.getOrders(storeId)
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