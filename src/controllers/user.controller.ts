import { TypedQuery, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ERROR, TryCatch } from "../common/type/response.type";
import { UserQuery } from "../query/user.query";
import { UserService } from "../services/user.service";

@Controller('user')
@ApiTags("유저")
export class UserController {
    constructor(
        private readonly userService: UserService
    ){}

    @TypedRoute.Post("regist")
    async registUser(
        @TypedQuery() query : UserQuery.UserQueryRegistOptions
    ) : Promise<TryCatch<
    boolean,
    | typeof ERROR.ServerCacheError
    | typeof ERROR.FailedSendMail
    >> {
        try {
            const result = await this.userService.registUser(query.email, query.pass, query.nickname)
            return { 
                data: result, 
                status: 201
            }
        } catch(e) { return e }
    }

    @TypedRoute.Post("regist/verify")
    async verifyCode(
        @TypedQuery() query : UserQuery.UserQueryVerifyCode
    ) : Promise<TryCatch<
    boolean,
    | typeof ERROR.ServerDatabaseError
    | typeof ERROR.NotFound
    >> {
        try {
            const result = await this.userService.verifyCode(query.code)
            return {
                data: result,
                status: 201
            }
        } catch(e) { return e }
    }

    @TypedRoute.Post("login")
    async loginUser() {}

    @TypedRoute.Post("payment/order")
    async paymentOrder() {}

    @TypedRoute.Post("payment/order/webhook")
    async sendOrderToMerchant() {}

    @TypedRoute.Post("payment/point")
    async paymentPoint() {}

    @TypedRoute.Post("payment/point/webhook")
    async chargePoint() {}

    @TypedRoute.Delete()
    async deleteUser() {}
}