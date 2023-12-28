import { Injectable } from "@nestjs/common";
import { Observable, Subject, filter, map } from "rxjs";
import { RedisService } from "./redis.service";
import { GiftNotifySubject, Notifier, OrderNotifySubject, SSESubject, UserNotifySubject } from "src/common/type/sse.type";
import { ERROR } from "src/common/type/response.type";

@Injectable()
export class SSEService {
    private sub = new Subject<SSESubject>()
    private obs = this.sub.asObservable()
    private notifiers: Notifier[] = []

    constructor(
        private readonly redis: RedisService,
    ){}

    listenSSE(
        listener_email: string,
    ) : Observable<MessageEvent<SSESubject>> {
        if(!!(this.notifiers.find(user => user.receiver_email === listener_email))) {
            throw ERROR.Conflict
        }
        this.notifiers.push({
            receiver_email: listener_email,
            subject: this.sub,
            observer: this.obs,
        })
        return this.obs
        .pipe(
            filter(data => this.notifyFactory(data, listener_email)),
            map(data => ({
                data,
            } as MessageEvent<SSESubject>))
        )
    }

    disconnectSSE(listener_email: string) {
        console.log(`${listener_email} has left...`)
        this.notifiers = this.notifiers.filter(user => user.receiver_email !== listener_email)
    }

    pushMessage(subject: SSESubject) {
        this.sub.next(subject)
    }

    private notifyFactory(
        data: SSESubject,
        listener_email: string,
    )
    : boolean {
        switch(data.notify_type) {
            case "event-notify":
            case "main-notify":
            case "update-notify":
                return true
            case "user-notify":
                const user_sub = data.subject as UserNotifySubject
                return this.checkReceiver({
                    receiver_email: user_sub.receiver_email,
                    listener_email,
                })
            case "gift-notify":
                const gift_sub = data.subject as GiftNotifySubject
                return this.checkReceiver({
                    receiver_email: gift_sub.gift.to,
                    listener_email,
                })
            case "order-notify":
                const order_sub = data.subject as OrderNotifySubject
                return this.checkReceiver({
                    receiver_email: order_sub.receiver_email,
                    listener_email,
                })
        }
    }

    private checkReceiver({
        receiver_email,
        listener_email,
    }: {
        receiver_email: string,
        listener_email: string,
    })
    : boolean {
        if(receiver_email !== listener_email) return false
        else {
            const isListening = !!(this.notifiers.find(user => user.receiver_email === listener_email))
            return isListening
        }
    }
}