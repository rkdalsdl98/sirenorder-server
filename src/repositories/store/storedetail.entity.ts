import { tags } from "typia"

export interface StoreDetailEntity {
    readonly description?: string
    readonly images: string[]
    readonly openhours: WeeklyHours
    readonly sirenorderhours: SirenOrderHours
    readonly phonenumber: string & tags.Pattern<"[0-9]{3}-[0-9]{4}-[0-9]{4}$">
    readonly parkinginfo: string
    readonly waytocome: string
}

export type Hours = {
    open: string,
    close: string,
}
export type WeeklyHours = {
    mon: Hours,
    tue: Hours,
    wed: Hours,
    thur: Hours,
    fri: Hours,
    sat: Hours,
    sun: Hours
}
export type SirenOrderHours = {
    sirenorder: WeeklyHours,
    dt?: WeeklyHours,
}