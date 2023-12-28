import { GiftWrappingType } from "../../common/type/gift.type"
import { SimpleCouponEntity } from "../coupon/coupon.entity"

export interface GiftEntity {
    readonly uuid: string
    readonly message: string
    readonly coupon: SimpleCouponEntity
    readonly to: string
    readonly from: string
    used: boolean
    readonly wrappingtype: GiftWrappingType
}