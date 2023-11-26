import { Injectable, Logger } from "@nestjs/common";
import { StoreDetailDto, StoreDto } from "../dto/store.dto";
import { StoreRepository } from "../repositories/store/store.repository";
import { RedisService } from "./redis.service";
import { StoreEntity } from "src/repositories/store/store.entity";
import { RoomJoinOptions } from "src/common/type/socket.type";
import { SocketGateWay } from "src/common/socket/socket.gateway";
import { OrderEntity } from "src/repositories/user/order.entity";
import { AuthService } from "./auth.service";
import { ConfigService } from "@nestjs/config";
import { ERROR } from "src/common/type/response.type";
import { PaymentData } from "src/common/type/payment";

@Injectable()
export class StoreService {
    constructor(
        private readonly storeRepository: StoreRepository,
        private readonly redis: RedisService,
        private readonly socket: SocketGateWay,
        private readonly auth: AuthService,
        private readonly config: ConfigService,
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

    async sendOrder({
        order_uid,
        imp_uid,
        status,
    })
    : Promise<boolean> {
        const store = (await this.redis.get<RoomJoinOptions[]>("stores", StoreService.name))
        ?.find(s => s.imp_uid === imp_uid)
        if(store && store.isOpen && store.socketId) {
            
        }
        return false
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

    private async _findOrderInfo(imp_uid: string) {
        const token = await this._getCertifiToken()
        const paymentData : PaymentData = await this._getPaymentData(imp_uid, token)
    }

    private async _getPaymentData(imp_uid: string, token: string) {
        const paymentData = await fetch(`https://api.iamport.kr/payments/${imp_uid}`,
            {
                method: "GET",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": token,
                },
            }
        )
        .then(res => res.json())
        .then(json => {
            const { response } = json
            return { ...response } as PaymentData
        })
        .catch(err => {
            console.log(err)
            Logger.error("주문정보 조회 실패", StoreService.name)
            throw ERROR.NotFoundData
        })

        return paymentData
    }

    private async _getCertifiToken() : Promise<string> {
        const impKey = this.config.get<string>("IMP_KEY")
        const impSecret = this.config.get<string>("IMP_SECRET")

        const token = await fetch("https://api.iamport.kr/users/getToken",{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                imp_key: impKey,
                imp_secret: impSecret
            })
        })
        .then(res => res.json())
        .then(json => {
            const { response } = json
            return response.access_token
        })
        .catch(err => {
            console.log(err)
            Logger.error("상점 자격인증 실패", StoreService.name)
            throw ERROR.UnAuthorized
        })

        return token
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