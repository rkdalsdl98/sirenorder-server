import { MenuInfo } from "./order.type"

export type GiftWrappingType = 
| "card1"
| "card2"
| "card3"
export type GiftInfo = {
    readonly from: string
    readonly to: string
    readonly menu: MenuInfo
    readonly message: string
    readonly wrappingtype: GiftWrappingType
    readonly imp_uid: string
    readonly order_uid: string
}