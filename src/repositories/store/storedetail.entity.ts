import { tags } from "typia"

export interface StoreDetailEntity {
    readonly description?: string
    readonly images: string[]
    readonly openhours
    readonly sirenorderhours
    readonly phonenumber: string & tags.Pattern<"[0-9]{3}-[0-9]{4}-[0-9]{4}$">
    readonly parkinginfo: string
    readonly waytocome: string
}