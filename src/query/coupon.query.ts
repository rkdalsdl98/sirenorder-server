import { MenuInfo } from "src/common/type/order.type";

export namespace CouponBody {
    export interface CouponBodyPublishBody {
        readonly user_email: string
        readonly menuinfo: MenuInfo
        readonly expiration_day?: number
    }
}