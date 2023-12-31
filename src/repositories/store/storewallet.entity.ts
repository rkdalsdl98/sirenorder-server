import { SalesEntity } from "./sales.entity";

export interface StoreWalletEntity {
    readonly point: number
    readonly sales: SalesEntity[]
    readonly store_uid: string
}