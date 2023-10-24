import { GiftWrappingType } from "src/common/type/gift.type"

export interface GiftEntity {
    readonly uuid: string
    readonly coupon: string
    readonly to: string
    readonly from: string
    readonly wrappingtype: GiftWrappingType
}