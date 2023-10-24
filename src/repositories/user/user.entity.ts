import { GiftEntity } from "./gift.entity"
import { OrderEntity } from "./order.entity"
import { WalletEntity } from "./wallet.entity"

export interface UserEntity {
    readonly uuid: string
    readonly email: string
    readonly pass: string
    readonly salt: string
    readonly wallet: WalletEntity | null
    readonly gifts: GiftEntity[]
    readonly coupons: string[]
    readonly order: OrderEntity | null
    readonly orderhistory: OrderHistory[]
    readonly token: { accesstoken: string, refreshtoken: string }
    readonly createdAt: Date
    readonly updatedAt: Date
}


type NestiedType<T> = {
    [key in keyof T]: T[key]
}
export type OrderHistory = NestiedType<Omit<OrderEntity, "uuid"> & { store_uid: string }>