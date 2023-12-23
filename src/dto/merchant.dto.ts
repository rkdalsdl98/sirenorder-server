export type MerchantDto = {
    readonly pass: string
    readonly imp_uid: string
    readonly storeinfo: StoreInfoDto
}

export type StoreInfoDto = {
    readonly storename: string
    readonly address: string
    readonly thumbnail: string
    readonly detail: StoreDetailInfoDto
}

export type Hours = {
    readonly open: string
    readonly close: string
}

export type StoreDetailInfoDto = {
    readonly openhours: Hours
    readonly sirenorderhours: Hours
    readonly phonenumber: string
    readonly parkinginfo?: string
    readonly waytocome?: string
    readonly images: string[]
    readonly description?: string
}