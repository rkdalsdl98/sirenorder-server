import { Injectable, Logger } from "@nestjs/common";
import { StoreDetailDto, StoreDto } from "../dto/store.dto";
import { StoreRepository } from "../repositories/store/store.repository";
import { RedisService } from "./redis.service";
import { StoreEntity } from "src/repositories/store/store.entity";
import { RoomJoinOptions } from "src/common/type/socket.type";
import { SocketGateWay } from "src/common/socket/socket.gateway";
import { OrderEntity } from "src/repositories/user/order.entity";
import { ERROR } from "src/common/type/response.type";
import { OrderDto } from "src/dto/user.dto";
import { PortOneMethod } from "src/common/methods/portone.method";
import { OrderState, RegisteredOrder } from "src/common/type/order.type";

@Injectable()
export class StoreService {
    constructor(
        private readonly storeRepository: StoreRepository,
        private readonly redis: RedisService,
        private readonly socket: SocketGateWay,
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

    // 실패 구문마다 주문 취소 루틴을 넣어주자
    // 주문취소 루틴에 주문번호를 넣어 캐시데이터만 삭제처리 하도록 해두었음
    async sendOrder({
        order_uid,
        imp_uid,
        status,
    })
    : Promise<boolean> {
        let result = false

        const order: OrderDto = await PortOneMethod.findOrder(imp_uid)
        let { storeId, orderInfo } = JSON.parse(order.custom_data)
        const store = (await this.redis.get<RoomJoinOptions[]>("stores", StoreService.name))
        ?.find(s => s.storeId === storeId)

        if(store && store.isOpen && store.socketId) {
            orderInfo = JSON.parse(orderInfo)
            const userUUIDs = { order_uid, imp_uid }
            const portOneUUIDs = { order_uid: order.merchant_uid, imp_uid: order.imp_uid }
            const { menus, deliveryinfo } = orderInfo

            if(!orderInfo || !this._equalUUIds(portOneUUIDs, userUUIDs)) {
                this._refuseOrder(order_uid)
                var err = ERROR.BadRequest
                err.substatus = "ForgeryData"
                throw err
            } else if(!store.socketId) {
                this._refuseOrder(order_uid)
                throw ERROR.ServiceUnavailableException
            }

            const orderEntity = {
                uuid: order.merchant_uid,
                imp_uid: order.imp_uid,
                saleprice: 0,
                totalprice: order.amount,
                store_uid: store.storeId,
                deliveryinfo,
                menus,
                state: "wait",
                buyer_email: order.buyer_email,
            } as RegisteredOrder

            await this.redis.set(orderEntity.uuid, orderEntity, StoreService.name)
            .catch( err => {
                this._refuseOrder(order_uid)
                Logger.error("주문정보 캐싱 실패", StoreService.name)
                throw err
            })
            result = this.socket.sendOrder(store.socketId, orderEntity)
        }
        return result
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

    async getOrderState(order_uid: string)
    : Promise<OrderState> {
        const order = await this.redis.get<RegisteredOrder>(
            order_uid,
            StoreService.name,
        )
        if(order === null) return "refuse"
        
        return order.state
    }

    private _equalUUIds(
        portOne: {imp_uid: string, order_uid: string},
        user: {imp_uid: string, order_uid: string},
    ) : boolean {
        return portOne.imp_uid === user.imp_uid && portOne.order_uid === user.order_uid
    }

    private async _refuseOrder(uuid: string)
    : Promise<void> {
        // const refused = await PortOneMethod.refuseOrder({
        //     redis: this.redis,
        //     reason: "조리불가",
        //     imp_uid: uuid,
        // })
            
        //if(!refused) Logger.error("주문삭제 실패", StoreService.name)
        await PortOneMethod.refuseOrderById({
            reason: "조리불가",
            redis: this.redis,
            order_uid: uuid,
        })
        .catch(err => {
            Logger.error("주문삭제 실패", StoreService.name)
            throw err
        })
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