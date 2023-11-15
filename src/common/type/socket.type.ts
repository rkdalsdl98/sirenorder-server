import { tags } from "typia"
import { FailedResponse } from "./response.type"
import { LatLng } from "src/repositories/store/store.entity"
import { StoreDetailEntity } from "src/repositories/store/storedetail.entity"

export type LoginRequest = {
    readonly merchantId: string
    readonly pass: 
    string 
    & tags.Pattern<"[0-9a-zA-Z]{6,20}">
    & tags.Pattern<"[\!\`\~\@\#\$\%\^\&\*\_\+\=\/\>\<\?]{1,}">
}

export type SocketResponseBody<T> = {
    readonly result: boolean
    readonly message: string
    readonly data?: T
}
export type SocketResponse<T, E extends FailedResponse> = 
SocketResponseBody<T> | SocketResponseBody<E> | any

export type RoomleaveOptions = {
    readonly storeId: string
}
export type RoomJoinOptions = {
    socketId?: string
    readonly storeId: string
    readonly storename: string
    readonly thumbnail?: string
    readonly location?: LatLng
    readonly address: string
    readonly detail: number | StoreDetailEntity
    readonly isOpen: boolean
}