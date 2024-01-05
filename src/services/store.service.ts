import { Injectable, Logger } from "@nestjs/common";
import { StoreDetailDto, StoreDto } from "../dto/store.dto";
import { StoreRepository } from "../repositories/store/store.repository";
import { RedisService } from "./redis.service";
import { StoreEntity } from "src/repositories/store/store.entity";
import { StoreCache } from "src/common/type/socket.type";
import { SocketGateWay } from "src/common/socket/socket.gateway";
import { DeliveryInfo, OrderEntity } from "src/repositories/user/order.entity";
import { ERROR } from "src/common/type/response.type";
import { OrderDto } from "src/dto/user.dto";
import { PortOneMethod } from "src/common/methods/portone.method";
import { OrderInfo, RegisteredOrder } from "src/common/type/order.type";
import { CouponService } from "./coupon.service";
import { GiftInfo } from "src/common/type/gift.type";
import { AuthService } from "./auth.service";
import { UserService } from "./user.service";

@Injectable()
export class StoreService {
    constructor(
        private readonly storeRepository: StoreRepository,
        private readonly couponService: CouponService,
        private readonly userService: UserService,
        private readonly authService: AuthService,
        private readonly redis: RedisService,
        private readonly socket: SocketGateWay,
    ){ this._initialized() }

    private async _initialized() :
    Promise<void> {
        await this.storeRepository.deleteOrders()
        const stores = (await this.storeRepository.getMany())
        .map(s => ({ ...s, storeId: s.uuid, isOpen: false } as StoreCache))
        await this.redis.set("stores", stores, StoreService.name)
        .then(_=> Logger.log("상점정보 인 메모리 캐싱"))
        .catch(err => {
            Logger.error("상점정보 인 메모리 캐싱실패")
            throw err
        })
    }

    async paymentFactory({
        order_uid,
        imp_uid,
        status,
    } : {
        order_uid: string,
        imp_uid: string,
        status: string,
    })
    : Promise<void> {
        const order: OrderDto = await PortOneMethod.findOrder(imp_uid)
        const userUUIDs = { order_uid, imp_uid }
        const portOneUUIDs = { order_uid: order.merchant_uid, imp_uid: order.imp_uid }
        if(!this._equalUUIds(portOneUUIDs, userUUIDs)) {
            this._refuseOrder(order_uid)
            var err = ERROR.BadRequest
            err.substatus = "ForgeryData"
            throw err
        }
        
        let { type } = JSON.parse(order.custom_data)
        switch(type) {
            case "order":
                await this.sendOrder({
                    order_uid,
                    order,
                })
                break
            case "gift":
                await this.sendGift({
                    order_uid,
                    imp_uid,
                    order,
                })
                break
        }
    }

    async useCoupon(
        storeId: string,
        user_email: string, 
        code: string,
        deliveryinfo: DeliveryInfo,
    ) : Promise<{ message?: string, result: boolean }> {
        const socketId = await this._isOpenStore(storeId)
        if(!socketId || socketId === undefined) {
            return {
                message: "영업중인 매장이 아닙니다.",
                result: false,
            }
        }
        const useResult = await this.couponService.checkValidateAndUpdateCoupon(
            user_email,
            code,
        )
        if(typeof useResult === "boolean") {
            return {
                message: "유효하지 않은 쿠폰사용으로 주문이 취소되었습니다",
                result: useResult,
            }
        } else {
            const uuid = this.authService.getRandUUID()
            const sales_uid = this.authService.getRandUUID()
            const order = {
                deliveryinfo: [deliveryinfo],
                imp_uid: uuid.substring(0, 12),
                menus: [useResult.menuinfo],
                saleprice: 0,
                store_uid: storeId,
                sales_uid,
                totalprice: "쿠폰결제",
                uuid,
                buyer_email: user_email,
                state: "wait",
            } satisfies RegisteredOrder
            await this.redis.set(order.uuid, order, StoreService.name)
            .catch(err => {
                this._refuseOrder(order.uuid)
                Logger.error("주문정보 캐싱 실패", StoreService.name)
                this.socket.pushStateMessage(user_email, "refuse")
                throw err
            })
            const result = this.socket.sendOrder(socketId, order)
            if(result) this.socket.pushStateMessage(user_email, "wait")
            return { result }
        }
    }

    async useGift(
        user_email: string, 
        code: string, 
        gift_uid: string
    ) : Promise<boolean> {
        return await this.couponService.useGiftCoupon(
            user_email,
            code,
            gift_uid,
        )
    }

    async sendGift({
        order_uid,
        imp_uid,
        order,
    } : {
        order_uid: string,
        imp_uid: string,
        order: OrderDto,
    }) 
    : Promise<void> {
        let { data } = JSON.parse(order.custom_data)
        let { giftInfo } : { giftInfo : GiftInfo } = JSON.parse(data)

        if(!giftInfo) {
            this._refuseOrder(order_uid)
            var err = ERROR.BadRequest
            err.substatus = "ForgeryData"
            throw err
        }
        const message = giftInfo.message ?? ""
        const gift = await this.couponService.sendGift({
            from: giftInfo.from,
            to: giftInfo.to,
            menu: giftInfo.menu,
            wrappingtype: giftInfo.wrappingtype,
            message: message,
            imp_uid: imp_uid,
            order_uid: order_uid,
        } as GiftInfo)
        this.socket.pushGiftMessage(gift)
    }

    // 실패 구문마다 주문 취소 루틴을 넣어주자
    // 주문취소 루틴에 주문번호를 넣어 캐시데이터만 삭제처리 하도록 해두었음
    async sendOrder({
        order_uid,
        order,
    } : {
        order_uid: string,
        order: OrderDto,
    })
    : Promise<boolean> {
        let result = false

        let { data } = JSON.parse(order.custom_data)
        let { storeId, orderInfo } : { storeId: string, orderInfo: OrderInfo } = JSON.parse(data)
        const store = (await this.redis.get<StoreCache[]>("stores", StoreService.name))
        ?.find(s => s.storeId === storeId)

        if(store && store.isOpen && store.socketId) {
            if(!orderInfo) {
                this._refuseOrder(order_uid)
                var err = ERROR.BadRequest
                err.substatus = "ForgeryData"
                throw err
            } else if(!store.socketId) {
                this._refuseOrder(order_uid)
                throw ERROR.Forbidden
            }

            const { menus, deliveryinfo, point } = orderInfo
            const sales_uid = this.authService.getRandUUID()
            const orderEntity = {
                uuid: order_uid,
                imp_uid: order.imp_uid,
                saleprice: 0,
                totalprice: order.amount,
                store_uid: store.storeId,
                deliveryinfo,
                menus,
                sales_uid,
                state: "wait",
                buyer_email: order.buyer_email!,
            } satisfies RegisteredOrder

            await this.redis.set(orderEntity.uuid, orderEntity, StoreService.name)
            .then(async () => {
                if(point !== undefined) {
                    await this.userService
                    .decreaseUserPoint(order.buyer_email!, point)
                }
            })
            .catch(err => {
                this._refuseOrder(order_uid)
                Logger.error("주문정보 캐싱 실패", StoreService.name)
                this.socket.pushStateMessage(order.buyer_email!, "refuse")
                throw err
            })
            result = this.socket.sendOrder(store.socketId, orderEntity)
        }
        if(result) this.socket.pushStateMessage(order.buyer_email!, "wait")
        else {
            this._refuseOrder(order_uid)
            this.socket.pushStateMessage(order.buyer_email!, "refuse")
            Logger.error("주문정보 전달 실패", StoreService.name)
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

    private async _isOpenStore(storeId: string)
    : Promise<string | undefined | null> {
        return (await this.redis.get<StoreCache[]>("stores", CouponService.name))
        ?.find(store => store.storeId === storeId)?.socketId
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
        await PortOneMethod.removeOrderById({
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
                uuid: s.uuid,
                address: s.address,
                location: s.location,
                thumbnail: s.thumbnail ?? "",
                detail: s.detail,
                storename: s.storename,
                isOpen: s['isOpen'] ?? false,
             } as StoreDto))
        }
        return (await this.storeRepository.getMany().catch(err => {
            Logger.error("상점 리스트 조회 실패", err) 
            throw err
        })).map(s => ({ 
            uuid: s.uuid,
            address: s.address,
            location: s.location,
            thumbnail: s.thumbnail ?? "",
            detail: s.detail,
            storename: s.storename,
            isOpen: s['isOpen'] ?? false,
         } as StoreDto))
    }
}