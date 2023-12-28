import { Observable, Subject } from "rxjs"
import { GiftEntity } from "src/repositories/user/gift.entity"
import { tags } from "typia"
import { OrderState } from "./order.type"

export type NotifyType =
| "update-notify"
| "event-notify"
| "main-notify"
| "gift-notify"
| "order-notify"
| "user-notify"
export type ServerNotifySubject = {
    readonly message: string
    readonly title: string
}
export type OrderNotifySubject = {
    readonly receiver_email: string & tags.Format<"email">
    readonly order_state: OrderState
}
export type GiftNotifySubject = {
    readonly gift: GiftEntity
}
export type UserNotifySubject = {
    readonly receiver_email: string & tags.Format<"email">
    readonly message: string
    readonly title: string
}
export type NotifySubject = ServerNotifySubject | OrderNotifySubject | GiftNotifySubject
export type SSESubject = {
    readonly notify_type: NotifyType
    readonly subject: NotifySubject 
}
export type Notifier = {
    readonly receiver_email: string & tags.Format<"email">
    readonly subject: Subject<SSESubject>
    readonly observer: Observable<SSESubject>
}
