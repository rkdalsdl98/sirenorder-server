import { MenuInfo } from "src/common/type/order.type"

export interface SalesEntity {
    readonly uuid?: string
    readonly amounts: number
    readonly menus: MenuInfo[]
    readonly salesdate: string
}