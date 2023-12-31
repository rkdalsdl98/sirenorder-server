import { DeliveryInfo, OrderEntity } from "src/repositories/user/order.entity"

export type MenuInfo = {
    readonly name: string
    readonly en_name: string
    readonly price: number
    readonly thumbnail: string
    readonly count: number
}

export type MenuSize = "default" | "Short" | "Tall" | "Grande" | "Venti"
export type PackagingMethod = "개인컵" | "매장컵" | "일회용컵"
export type MenuTempture = "COLD" | "HOT"

export type OrderState = 
| "wait" 
| "refuse" 
| "accept"
| "finish"

export type RefuseOrder = {
    readonly uuid: string
    readonly imp_uid: string
    readonly reason: string
}

type NestedType<T> = {
    [Key in keyof T]: T[Key]
}
export type RegisteredOrder = 
NestedType<OrderEntity 
& { 
    readonly state: OrderState
    readonly buyer_email: string
    readonly sales_uid: string
}>

export type OrderInfo = {
    readonly menus: MenuInfo[]
    readonly deliveryinfo: DeliveryInfo[]
}