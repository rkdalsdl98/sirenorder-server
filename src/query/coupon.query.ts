import { MenuInfo } from "src/common/type/order.type";
import { tags } from "typia"

export interface CouponQuery {
    readonly user_email: string & tags.Format<"email">
    readonly code: string & tags.MaxLength<12>
}
export namespace CouponQuery {
    export interface CouponQueryDeleteOptions extends CouponQuery {
        readonly message: string
    }
}

export namespace CouponBody {
    export interface CouponBodyPublishBody {
        readonly menuinfo: MenuInfo
        readonly expiration_day?: number
    }
}