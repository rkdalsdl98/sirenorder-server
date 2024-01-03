import { TypedBody, TypedQuery, TypedRoute } from "@nestia/core";
import { Controller, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthDecorator } from "src/common/decorators/auth.decorator";
import { AuthGuard } from "src/common/guards/auth.guard";
import { CouponGuard } from "src/common/guards/coupon.guard";
import { ERROR, FailedResponse, TryCatch } from "src/common/type/response.type";
import { CouponBody, CouponQuery } from "src/query/coupon.query";
import { SimpleCouponEntity } from "src/repositories/coupon/coupon.entity";
import { CouponService } from "src/services/coupon.service";

@Controller("coupon")
@ApiTags("쿠폰")
export class CouponController {
    constructor(
        private readonly couponService: CouponService,
    ){}
    
    @TypedRoute.Post("register")
    async registerCoupon(
        @TypedQuery() query: CouponQuery
    )
    : Promise<TryCatch<
    SimpleCouponEntity,
    | typeof ERROR.NotFoundData
    | typeof ERROR.ServerDatabaseError
    | typeof ERROR.ServiceUnavailableException
    >> {
        try {
            const result = await this.couponService.registerCoupon(
                query.user_email,
                query.code,
            )
            return {
                data: result,
                status: 201,
            }
        } catch(e) { return e }
    }

    @TypedRoute.Post("publish/stamp")
    @UseGuards(AuthGuard)
    async publishStampCoupon(
        @AuthDecorator.GetTokenAndPayload() data: 
        | { payload: any, token: string }
        | { payload: any }
    ) 
    : Promise<TryCatch<
    | SimpleCouponEntity
    | null,
    | typeof ERROR.NotFoundData
    | typeof ERROR.ServerDatabaseError
    | typeof ERROR.ServiceUnavailableException
    >> {
        try {
            if("email" in data.payload
            && "authorized" in data.payload) {
                const authorized = data.payload.authorized as boolean
                if(authorized) {
                    const result = 
                    await 
                    this.couponService
                    .publishAndRegisterStampCoupon(data.payload.email)
                    return {
                        data: result,
                        status: 201,
                    }
                }
                var err = ERROR.UnAuthorized
                err.substatus = "ExpiredToken"
                throw err
            }
            throw ERROR.UnAuthorized
        } catch(e) { return e }
    }

    @TypedRoute.Post("publish")
    @UseGuards(CouponGuard)
    async publishCoupon(
        @AuthDecorator.IsValidCoupon() data: boolean | FailedResponse,
        @TypedBody() body: CouponBody.CouponBodyPublishBody,
    ) 
    : Promise<TryCatch<
    | string
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
                
                const result = await this.couponService.publishCoupon({
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
        @TypedQuery() query: CouponQuery.CouponQueryDeleteOptions
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
                const result = await this.couponService.deleteCoupon({
                    user_email: query.user_email,
                    code: query.code,
                    message: query.message,
                })

                return {
                    data: result,
                    status: 201,
                }
            } else throw data
        } catch(e) { return e }
    }
}