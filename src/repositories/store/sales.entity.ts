import { MenuInfo } from "src/common/type/order.type"

export interface SalesEntity {
    readonly id?: number
    readonly amounts: number
    readonly menus: MenuInfo[]
    readonly salesdate: string
}