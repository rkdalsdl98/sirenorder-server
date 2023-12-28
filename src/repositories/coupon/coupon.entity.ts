import { MenuInfo } from "../../common/type/order.type"

export interface CouponEntity {
    readonly code: string
    readonly menuinfo: MenuInfo
    readonly expiration_period: Date
}

export interface SimpleCouponEntity {
    readonly code: string
    readonly menu_name: string
    readonly expiration_period: Date
    readonly thumbnail?: string
}

export interface CouponInfo {
    readonly menuinfo: MenuInfo
    readonly expiration_day?: number
}