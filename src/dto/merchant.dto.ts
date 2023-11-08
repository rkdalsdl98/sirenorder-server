export type MerchantDto = {
    readonly pass: string
    readonly storeinfo: StoreInfoDto
}

export type StoreInfoDto = {
    readonly storename: string
    readonly storeaddress: string
    readonly thubmnail: string
    readonly detail: StoreDetailInfoDto
}

export type Hours = {
    readonly open: string
    readonly close: string
}

export type SirenOrderHours = {
    readonly sirenorder: Hours
    readonly dt: Hours
}

export type StoreDetailInfoDto = {
    readonly hours: { openhours: Hours, sirenorderhours: SirenOrderHours }
    readonly phonenumber: string
    readonly parkinginfo?: string
    readonly waytocome?: string
    readonly images: string[]
    readonly description?: string
}