import { MenuInfo } from "../../common/type/order.typs"

export interface OrderEntity {
    readonly saleprice: number
    readonly totalprice: number
    readonly store_uid: string
    readonly deliveryinfo: DeliveryInfo
    readonly menus: MenuInfo[]
}
export type DeliveryInfo = {
    readonly memo: string
    readonly take: boolean
    readonly paymenttype: PaymentType
}
export type PaymentType = 
| "virtual-account"
| "none-account"
| "card"
| "paid"