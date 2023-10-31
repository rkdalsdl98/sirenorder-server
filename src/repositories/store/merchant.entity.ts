import { StoreEntity } from "./store.entity"

export interface MerchantEntity {
    readonly pass: string
    readonly salt: string
    readonly store: StoreEntity
}