import { tags } from "typia"

export interface MenuEntity {
    readonly id: number
    readonly name: string
    readonly en_name: string & tags.Pattern<"[a-zA-Z0-9]+$">
    readonly category: Category
    readonly price: number
    readonly thumbnail: string & tags.Format<"url">
    readonly detailId: number
}

export type Category =
| "drink"
| "food"
| "product"