import { SalesEntity } from "./sales.entity";

export interface StoreWalletEntity {
    readonly sales: SalesEntity[]
    readonly store_uid: string
}