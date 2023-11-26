import { MenuInfo } from "src/common/type/order.typs"
import { DeliveryInfo } from "src/repositories/user/order.entity"

export namespace StoreQuery {
    export interface StoreQueryGetOrdersOptions {
        readonly storeId: string
    }
    export interface StoreQueryCreateOrderOptions {
        readonly saleprice: number
        readonly totalprice: number
        readonly store_uid: string
        readonly deliveryinfo: DeliveryInfo
        readonly menus: MenuInfo[]
    }
}

export namespace PortOneRequest {
    export interface PortOneRequestBody {
        readonly imp_uid: string
        readonly merchant_uid: string
        readonly status: PaymentRequestStatus
    }
}

export type PaymentRequestStatus = 
| "paid" // 결제가 승인되었을 때 or 가상계좌에 결제 금액이 입금되었을 때
| "ready" // 가상계좌가 발급되었을 때
| "failed" // 결제에 실패했을 때 or 예약결제가 시도되었을 때 ("paid" or "failed")
| "cancelled" // 관리자 콘솔에서 결제 취소되었을 때