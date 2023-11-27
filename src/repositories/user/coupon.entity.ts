import { MenuInfo } from "../../common/type/order.type"

export interface CouponEntity {
    readonly code: string
    readonly menuinfo: MenuInfo
    readonly expirationperiod: Date
}