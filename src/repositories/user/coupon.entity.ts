import { MenuInfo } from "src/common/type/order.typs"

export interface CouponEntity {
    readonly code: string
    readonly menuinfo: MenuInfo
    readonly expirationperiod: Date
}