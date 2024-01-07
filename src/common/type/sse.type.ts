import { Observable, Subject } from "rxjs"
import { GiftEntity } from "src/repositories/user/gift.entity"
import { tags } from "typia"
import { OrderState } from "./order.type"
import { OrderHistory } from "src/repositories/user/user.entity"

export interface NotifySubject {}
export type NotifyType =
| "update-notify"
| "event-notify"
| "main-notify"
| "gift-notify"
| "order-notify"
| "user-notify"
export interface ServerNotifySubject extends NotifySubject {
    readonly message: string
    readonly title: string
}
export interface OrderNotifySubject extends NotifySubject {
    readonly receiver_email: string & tags.Format<"email">
    readonly order_state: OrderState
    readonly increase_point?: number
    readonly increase_stars?: number
    readonly history?: OrderHistory
}
export interface GiftNotifySubject extends NotifySubject {
    readonly gift: GiftEntity
}
export interface UserNotifySubject extends NotifySubject {
    readonly receiver_email: string & tags.Format<"email">
    readonly message: string
    readonly title: string
}
export type SSESubject = {
    readonly notify_type: NotifyType
    readonly subject: NotifySubject 
}
export type Notifier = {
    readonly receiver_email: string & tags.Format<"email">
    readonly subject: Subject<SSESubject>
    readonly observer: Observable<SSESubject>
}
