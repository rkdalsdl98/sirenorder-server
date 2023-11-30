import { OrderEntity } from "src/repositories/user/order.entity"

export type MenuInfo = {
    readonly name: string
    readonly price: number
    readonly thumbnail: string
    readonly count: number
    readonly size: MenuSize
    readonly bottle: MenuBottle
    readonly tempture: MenuTempture
}

export type MenuSize = "default" | "mega"
export type MenuBottle = "persornal" | "disposable" | "plastic"
export type MenuTempture = "ice" | "hot"

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
export type RegisteredOrder = NestedType<OrderEntity & { readonly state: OrderState }>