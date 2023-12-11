import { MenuInfo } from "src/common/type/order.type";

export namespace CouponQuery {
    export interface CouponQueryUseOptions {
        readonly user_email: string
        readonly code: string
    }
}

export namespace CouponBody {
    export interface CouponBodyPublishBody {
        readonly user_email: string
        readonly menuinfo: MenuInfo
        readonly expiration_day?: number
    }
}