import { TypedBody, TypedQuery, TypedRoute } from "@nestia/core";
import { Controller, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthDecorator } from "src/common/decorators/auth.decorator";
import { CouponGuard } from "src/common/guards/coupon.guard";
import { ERROR, FailedResponse, TryCatch } from "src/common/type/response.type";
import { CouponBody } from "src/query/coupon.query";
import { SimpleCouponEntity } from "src/repositories/coupon/coupon.entity";
import { CouponService } from "src/services/coupon.service";

@Controller("coupon")
@ApiTags("쿠폰")
export class CouponController {
    constructor(
        private readonly couponService: CouponService,
    ){}

    @TypedRoute.Post("publish")
    @UseGuards(CouponGuard)
    async publishCoupon(
        @AuthDecorator.IsValidCoupon() data: boolean | FailedResponse,
        @TypedBody() body: CouponBody.CouponBodyPublishBody,
    ) 
    : Promise<TryCatch<
    | SimpleCouponEntity
    | null,
    | typeof ERROR.NotFoundData
    | typeof ERROR.ServerDatabaseError
    | typeof ERROR.ServiceUnavailableException
    >> {
        try {
            if(typeof data === "boolean") {
                if(!data) return {
                    data: null,
                    status: 202
                }
                
                const result = await this.couponService.publishCoupon(body.user_email, 
                    {
                    menuinfo: body.menuinfo,
                    expiration_day: body.expiration_day,
                })
                
                return {
                    data: result,
                    status: 201,
                }
            } else throw data
        } catch(e) { return e }
    }

    @TypedRoute.Delete()
    @UseGuards(CouponGuard)
    async deleteCoupon(
        @AuthDecorator.IsValidCoupon() data: boolean | FailedResponse,
        @TypedQuery() query: { code: string, user_email: string }
    ) : Promise<TryCatch<
    boolean,
    | typeof ERROR.NotFoundData
    | typeof ERROR.ServerDatabaseError
    | typeof ERROR.ServiceUnavailableException
    >> {
        try {
            if(typeof data === "boolean") {
                if(!data) return {
                    data,
                    status: 202
                }
                const result = await this.couponService.deleteCoupon(query.user_email, query.code)

                return {
                    data: result,
                    status: 201,
                }
            } else throw data
        } catch(e) { return e }
    }
}