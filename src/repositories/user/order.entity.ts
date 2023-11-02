import { MenuInfo } from "../../common/type/order.typs"

export interface OrderEntity {
    readonly saleprice: number
    readonly totalprice: number
    readonly merchant_uid: string
    readonly menuinfo: MenuInfo
}