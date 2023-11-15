import { MenuInfo } from "src/common/type/order.typs"
import { DeliveryInfo } from "src/repositories/user/order.entity"

export namespace StoreQuery {
    export interface StoreQueryGetOrdersOptions {
        readonly storeId: string
    }
}

export namespace StoreBody {
    export interface StoreBodyCreateOrderOptions {
        readonly saleprice: number
        readonly totalprice: number
        readonly store_uid: string
        readonly deliveryinfo: DeliveryInfo
        readonly menus: MenuInfo[]
    }
}