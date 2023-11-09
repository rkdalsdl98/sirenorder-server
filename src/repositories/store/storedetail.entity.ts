export interface StoreDetailEntity {
    readonly description?: string
    readonly images: string[]
    readonly openhours: WeeklyHours
    readonly sirenorderhours: WeeklyHours
    readonly phonenumber: string
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