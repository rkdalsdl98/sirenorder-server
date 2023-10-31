import { OrderEntity } from "../user/order.entity"
import { WalletEntity } from "../user/wallet.entity"
import { StoreDetailEntity } from "./storedetail.entity"

export interface StoreEntity {
    readonly storecode: number
    readonly storename: string
    readonly thumbnail?: string
    readonly location
    readonly address: string
    readonly orders: OrderEntity[]
    readonly wallet: WalletEntity
    readonly detail: StoreDetailEntity
}