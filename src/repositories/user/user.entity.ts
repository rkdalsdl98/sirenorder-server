import { SimpleCouponEntity } from "../coupon/coupon.entity"
import { GiftEntity } from "./gift.entity"
import { OrderEntity } from "./order.entity"
import { WalletEntity } from "./wallet.entity"

export interface UserEntity {
    readonly uuid: string
    readonly tel: string
    readonly email: string
    readonly nickname: string
    readonly pass: string
    readonly salt: string
    readonly wallet: WalletEntity | null
    readonly gifts: GiftEntity[]
    readonly coupons: SimpleCouponEntity[]
    readonly orderhistory: OrderHistory[]
    readonly accesstoken: string | null,
    readonly refreshtoken: string | null,
    createdAt: Date
    updatedAt: Date
}


type NestiedType<T> = {
    [key in keyof T]: T[key]
}
export type OrderHistory = 
NestiedType<Omit<OrderEntity, 
| "uuid" 
| "merchant_uid"
| "deliveryinfo"
> & { 
    store_uid: string, 
    store_name: string,
    store_thumbnail?: string,
}>