import { TypedQuery, TypedRoute } from "@nestia/core";
import { Controller, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ERROR, TryCatch } from "../common/type/response.type";
import { UserQuery } from "../query/user.query";
import { UserService } from "../services/user.service";
import { AuthGuard } from "src/common/guards/auth.guard";
import { UserEntity } from "src/repositories/user/user.entity";
import { AuthDecorator } from "src/common/decorators/auth.decorator";
import { UserDto } from "src/dto/user.dto";

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
    | typeof ERROR.NotFoundData
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
    async loginUser(
        @TypedQuery() query: UserQuery.UserQueryLoginOptions
    ) : Promise<TryCatch<
    UserDto,
    | typeof ERROR.ServerDatabaseError
    | typeof ERROR.NotFoundData
    | typeof ERROR.UnAuthorized
    >> {
        try {
            const result = await this.userService.loginByPass(query.email, query.pass)
            return {
                data: result,
                status: 200
            }
        } catch(e) { return e }
    }

    @TypedRoute.Post("login/token")
    @UseGuards(AuthGuard)
    async tokenLogin(
        @AuthDecorator.GetTokenAndPayload() data: { payload: any, token:string }
    ) : Promise<TryCatch<
    UserDto,
    | typeof ERROR.ServerDatabaseError
    | typeof ERROR.NotFoundData
    | typeof ERROR.UnAuthorized
    >> {
        try {
            if(data.payload === null) {
                const result = await this.userService.checkRefresh(data.token)
                return {
                    data: result,
                    status: 201,
                }
            } else if("email" in data.payload) {
                const result = await this.userService.loginByEmail(data.payload.email)
                return {
                    data: result,
                    status: 201,
                }
            } else return data.payload
        } catch(e) { return e }
    }

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