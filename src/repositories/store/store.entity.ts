import { StoreDetailEntity } from "./storedetail.entity"
import { StoreWalletEntity } from "./storewallet.entity"

export interface StoreEntity {
    readonly storename: string
    readonly thumbnail?: string
    readonly location: LatLng
    readonly address: string
    readonly wallet?: StoreWalletEntity
    readonly detail: number | StoreDetailEntity
}

export type LatLng = {
    latitude: number,
    longitude: number
}