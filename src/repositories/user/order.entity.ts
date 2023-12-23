import { MenuInfo, MenuSize, MenuTempture, PackagingMethod } from "../../common/type/order.type"

export interface OrderEntity {
    readonly uuid: string
    readonly imp_uid: string
    readonly saleprice: number
    readonly totalprice: number
    readonly store_uid: string
    readonly deliveryinfo: DeliveryInfo | DeliveryInfo[]
    readonly menus: MenuInfo[]
}
export type DeliveryInfo = {
    readonly memo: string
    readonly take: boolean
    readonly paymenttype: PaymentType
    readonly size: MenuSize
    readonly packagingMethod: PackagingMethod
    readonly tempture: MenuTempture
}
export type PaymentType = 
| "virtual-account"
| "none-account"
| "card"
| "paid"